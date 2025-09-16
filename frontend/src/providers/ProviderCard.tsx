import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExternalLink } from "lucide-react";
import { ProviderDataEntry } from "../../../shared/src/provider";
import { displayDifficulty, displayHours } from "@/utils";
import { getProviderScore } from "./provider-utils";

const getScoreVariant = (score: number) => {
  if (score > 75) return "success";
  if (score > 40) return "warning";
  return "destructive";
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
      allTime: displayHours(provider.totalWorkHours),
      h24: displayHours(provider.totalWorkHours24h),
    },
    {
      label: "Work Done",
      allTime: displayDifficulty(provider.totalWork),
      h24: displayDifficulty(provider.totalWork24h),
    },
    { label: "Total Cost (GLM)", allTime: provider.totalCost.toFixed(4), h24: provider.totalCost24h.toFixed(4) },
    {
      label: "Speed",
      allTime: `${displayDifficulty(provider.speed)}/s`,
      h24: `${displayDifficulty(provider.speed24h)}/s`,
    },
    {
      label: "Efficiency",
      allTime: `${displayDifficulty(provider.efficiency)}/GLM`,
      h24: `${displayDifficulty(provider.efficiency24h)}/GLM`,
    },
    { label: "Jobs", allTime: provider.numberOfJobs, h24: provider.numberOfJobs24h },
    { label: "Longest Job", allTime: displayHours(provider.longestJob), h24: displayHours(provider.longestJob24h) },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg">
              <span className="text-muted-foreground">#{rank}</span> {provider.providerName}
            </CardTitle>
            <CardDescription className="font-mono text-xs break-all pt-1">{provider.providerId}</CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={getScoreVariant(score) as any}>{score.toFixed(1)}% Score</Badge>
            <a
              href={`https://stats.golem.network/network/provider/${provider.providerId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              Stats <ExternalLink className="h-3 w-3" />
            </a>
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
                <TableCell className="font-medium">{metric.label}</TableCell>
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
