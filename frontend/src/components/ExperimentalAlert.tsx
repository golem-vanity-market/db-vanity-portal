import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TriangleAlert } from "lucide-react";

const ExperimentalAlert = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasSeenAlert = localStorage.getItem("hasSeenExperimentalAlert");
    if (!hasSeenAlert) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("hasSeenExperimentalAlert", "true");
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-11/12 max-w-md -translate-x-1/2 sm:left-4 sm:translate-x-0">
      <Alert>
        <TriangleAlert className="h-4 w-4" />
        <AlertTitle>Experimental Feature</AlertTitle>
        <AlertDescription>
          This page is experimental. Information may not always be accurate or up to date. Please use as reference only.
        </AlertDescription>
        <div className="flex justify-end">
          <Button variant="destructive" className="mt-4" onClick={handleDismiss}>
            {`Don't show again`}
          </Button>
        </div>
      </Alert>
    </div>
  );
};

export default ExperimentalAlert;
