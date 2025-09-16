import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, ArrowRight, Database } from "lucide-react";
import { Link } from "react-router-dom";

const Welcome = () => {
  const dbOwnerAddress = import.meta.env.VITE_GOLEM_DB_OWNER_ADDRESS;
  const explorerUrl = `https://explorer.ethwarsaw.holesky.golemdb.io/address/${dbOwnerAddress}`;
  const providersUrl = `/providers`;

  return (
    <div className="flex w-full items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Provider estimations</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Alert variant="default">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>This project is still experimental</AlertTitle>
            <AlertDescription>
              The data displayed is based on the best available information but may not always be 100% accurate or
              up-to-date. Please use it as a reference.
            </AlertDescription>
          </Alert>

          <Separator />

          <div className="flex items-start gap-4 rounded-md p-4 text-sm">
            <Database className="mt-1 h-5 w-5 flex-shrink-0 text-muted-foreground" />
            <div className="flex-grow">
              <h3 className="font-semibold">Data Source</h3>
              <p className="text-muted-foreground">Data is presented using aggregator on address:</p>
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block break-all text-xs font-mono text-primary underline-offset-4 hover:underline"
              >
                {dbOwnerAddress}
              </a>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full sm:w-auto ml-auto">
            <Link to={providersUrl}>
              View Providers
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Welcome;
