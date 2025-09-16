import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExternalLink } from "lucide-react";
import { ProviderDataEntry } from "../../../shared/src/provider";
import { displayDifficulty, displayHours } from "@/utils";
import { getProviderScore } from "./provider-utils";
import { CircleDollarSign, Cpu, GaugeCircle, Hash, Timer, TrendingUp } from "lucide-react";

const getScoreClassName = (score: number) => {
  if (score > 75) return "text-green-600 bg-green-100";
  if (score > 40) return "text-yellow-600 bg-yellow-100";
  return "text-red-600 bg-red-100";
};

interface ProviderCardProps {
  provider: ProviderDataEntry;
  rank: number;
}

export const ProviderCard = ({ provider, rank }: ProviderCardProps) => {
  const score = getProviderScore(provider);
  const metrics = [
    {
      label: "Work Hours",
      icon: <Timer className="size-4" />,
      allTime: displayHours(provider.totalWorkHours),
      h24: displayHours(provider.totalWorkHours24h),
    },
    {
      label: "Work Done",
      icon: <Cpu className="size-4" />,
      allTime: displayDifficulty(provider.totalWork),
      h24: displayDifficulty(provider.totalWork24h),
    },
    {
      label: "Total Cost",
      icon: <CircleDollarSign className="size-4" />,
      allTime: `${provider.totalCost.toFixed(4)} GLM`,
      h24: `${provider.totalCost24h.toFixed(4)} GLM`,
    },
    {
      label: "Speed",
      icon: <GaugeCircle className="size-4" />,
      allTime: `${displayDifficulty(provider.speed)}/s`,
      h24: `${displayDifficulty(provider.speed24h)}/s`,
    },
    {
      label: "Efficiency",
      icon: <TrendingUp className="size-4" />,
      allTime: `${displayDifficulty(provider.efficiency)}/GLM`,
      h24: `${displayDifficulty(provider.efficiency24h)}/GLM`,
    },
    {
      label: "Jobs",
      icon: <Hash className="size-4" />,
      allTime: provider.numberOfJobs,
      h24: provider.numberOfJobs24h,
    },
    {
      label: "Longest Job",
      icon: <Timer className="size-4" />,
      allTime: displayHours(provider.longestJob),
      h24: displayHours(provider.longestJob24h),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="text-muted-foreground">#{rank}</span>
              <a
                href={`https://stats.golem.network/network/provider/${provider.providerId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary flex items-center gap-1 text-lg underline"
              >
                {provider.providerName}
                <ExternalLink className="size-4" />
              </a>
            </CardTitle>
            <CardDescription className="break-all pt-1 font-mono text-xs">{provider.providerId}</CardDescription>
            <CardDescription className="break-all pt-1 font-mono text-xs">
              <a
                href={`https://explorer.ethwarsaw.holesky.golemdb.io/entity/${provider.key}?tab=data`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary flex items-center gap-1 text-xs underline"
              >
                {provider.key}
              </a>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getScoreClassName(score)}>{score.toFixed(1)}% Score</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Metric</TableHead>
              <TableHead className="text-right">All Time</TableHead>
              <TableHead className="text-right">Last 24h</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {metrics.map((metric) => (
              <TableRow key={metric.label}>
                <TableCell className="font-medium">
                  <div className="text-muted-foreground flex items-center gap-2">
                    {metric.icon}
                    <span className="text-card-foreground">{metric.label}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">{metric.allTime}</TableCell>
                <TableCell className="text-right">{metric.h24}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
