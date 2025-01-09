"use client";

import { useMemo } from "react";
import { Card, CardHeader, CardContent } from "~/components/ui/Card";
import { Text } from "~/components/ui/Text";
import { Progress } from "~/components/ui/Progress";
import { Trip } from "~/types/trips";
import { ResponsiveTreeMap } from "@nivo/treemap";
import { ResponsiveLine } from "@nivo/line";
import { DollarSign } from "lucide-react";

interface TripBudgetProps {
  trip: Trip;
}

export function TripBudget({ trip }: TripBudgetProps) {
  // Calculate spending by category
  const categoryData = useMemo(() => {
    const categories = new Map<string, number>();
    
    trip.activities?.forEach((activity) => {
      const category = activity.category || "Other";
      categories.set(
        category,
        (categories.get(category) || 0) + activity.activityCost
      );
    });

    return {
      name: "expenses",
      children: Array.from(categories.entries()).map(([name, value]) => ({
        name,
        value
      }))
    };
  }, [trip]);

  // Calculate daily spending trend
  const spendingTrend = useMemo(() => {
    const dailySpending = new Map<string, number>();
    
    trip.activities?.forEach((activity) => {
      const date = new Date(activity.date).toISOString().split("T")[0];
      dailySpending.set(
        date,
        (dailySpending.get(date) || 0) + activity.activityCost
      );
    });

    const sortedDates = Array.from(dailySpending.keys()).sort();
    let runningTotal = 0;

    return [{
      id: "cumulative-spending",
      data: sortedDates.map(date => {
        runningTotal += dailySpending.get(date) || 0;
        return {
          x: date,
          y: runningTotal
        };
      })
    }];
  }, [trip]);

  const spentPercentage = trip.spentSoFar
    ? (trip.spentSoFar / trip.tripBudget) * 100
    : 0;

  return (
    <Card>
      <CardHeader
        title={
          <div className="flex items-center justify-between">
            <Text variant="h4">Budget & Expenses</Text>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <Text variant="h4">${trip.tripBudget.toLocaleString()}</Text>
            </div>
          </div>
        }
      />
      <CardContent>
        <div className="grid grid-cols-1 gap-8 w-full">
          {/* Overall Budget Progress */}
          <div className="grid grid-cols-1 gap-2 w-full">
            <div className="flex justify-between text-sm">
              <Text variant="body-sm" color="secondary">Total Spent</Text>
              <Text variant="body-sm" color="secondary">
                ${trip.spentSoFar?.toLocaleString() || 0} of ${trip.tripBudget.toLocaleString()}
              </Text>
            </div>
            <Progress
              value={spentPercentage}
              className={spentPercentage > 90 ? "text-red-500" : ""}
            />
          </div>

          {/* Spending by Category */}
          <div className="grid grid-cols-1 w-full">
            <Text variant="body-sm" color="secondary" className="mb-4">
              Spending by Category
            </Text>
            <div className="h-[200px] w-full">
              <ResponsiveTreeMap
                data={categoryData}
                identity="name"
                value="value"
                valueFormat=" >-$,.2f"
                margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                labelSkipSize={12}
                labelTextColor={{
                  from: "color",
                  modifiers: [["darker", 1.2]],
                }}
                parentLabelPosition="left"
                parentLabelTextColor={{
                  from: "color",
                  modifiers: [["darker", 2]],
                }}
                borderColor={{
                  from: "color",
                  modifiers: [["darker", 0.1]],
                }}
              />
            </div>
          </div>

          {/* Spending Trend */}
          <div className="grid grid-cols-1 w-full">
            <Text variant="body-sm" color="secondary" className="mb-4">
              Cumulative Spending
            </Text>
            <div className="h-[200px] w-full">
              <ResponsiveLine
                data={spendingTrend}
                margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
                xScale={{
                  type: "time",
                  format: "%Y-%m-%d",
                  useUTC: false,
                  precision: "day",
                }}
                xFormat="time:%Y-%m-%d"
                yScale={{
                  type: "linear",
                  min: 0,
                  max: trip.tripBudget,
                }}
                axisLeft={{
                  format: (value) => `$${value.toLocaleString()}`,
                }}
                axisBottom={{
                  format: "%b %d",
                  tickRotation: -45,
                }}
                enablePoints={false}
                enableArea={true}
                areaOpacity={0.1}
                useMesh={true}
                curve="monotoneX"
                theme={{
                  axis: {
                    ticks: {
                      text: {
                        fontSize: 11,
                      },
                    },
                  },
                }}
                colors={["#60a5fa"]}
              />
            </div>
          </div>

          {/* Budget Alerts */}
          {spentPercentage > 90 && (
            <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
              <Text variant="body-sm" className="text-red-500">
                Warning: You have spent {Math.round(spentPercentage)}% of your budget
              </Text>
            </div>
          )}
          {spentPercentage > 75 && spentPercentage <= 90 && (
            <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <Text variant="body-sm" className="text-yellow-500">
                Note: You have spent {Math.round(spentPercentage)}% of your budget
              </Text>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}