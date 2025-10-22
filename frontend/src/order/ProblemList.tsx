import { problemsById } from "./problem-config";
import type { Problem } from "db-vanity-model/src/order-schema.ts";

const getProblemDisplayName = (problem: Problem) => {
  const config = problemsById[problem.type];
  switch (problem.type) {
    case "user-prefix":
    case "user-suffix":
    case "user-mask":
      return `${config.label}: ${problem.specifier}`;
    case "leading-any":
    case "trailing-any":
      return `${config.label}: ${problem.length}`;
    case "letters-heavy":
    case "snake-score-no-case":
      return `${config.label}: ${problem.count}`;
    default:
      return config.label;
  }
};

export function ProblemList({ problems }: { problems: Problem[] }) {
  return (
    <ul className="space-y-2">
      {problems.map((p, idx) => {
        const config = problemsById[p.type];
        return (
          <li key={idx} className="rounded-md bg-muted/40 p-2">
            <div className="text-sm font-medium">
              {getProblemDisplayName(p)}
            </div>
            <div className="text-xs text-muted-foreground">
              {config.description}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default ProblemList;
