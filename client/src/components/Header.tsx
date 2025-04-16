import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";
import { BarChart3, Moon, Sun, Upload } from "lucide-react";
import { useRef } from "react";
import { useDataContext } from "@/hooks/useDataContext";
import Papa from "papaparse";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function Header() {
  const { setTheme, theme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setData } = useDataContext();
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        complete: async (results) => {
          try {
            if (results.data.length === 0) {
              toast({
                title: "Error",
                description: "The CSV file is empty",
                variant: "destructive",
              });
              return;
            }

            // Transform data to match our schema
            const transformedData = results.data.map((row: any) => ({
              familyHistory: row["Family History of Mental Illness"],
              companySize: row["Company Size"],
              year: row["year"]?.toString(),
              age: typeof row["Age"] === 'number' ? row["Age"] : null,
              ageGroup: row["Age-Group"],
              gender: row["Gender"],
              soughtTreatment: row["Sought Treatment"] === 1,
              preferAnonymity: row["Prefer Anonymity"] === 1,
              rateReactionToProblems: row["Rate Reaction to Problems"],
              negativeConsequences: row["Negative Consequences"],
              location: row["Location"],
              accessToInformation: row["Access to information"] === 1,
              insurance: row["Insurance"] === 1,
              diagnosis: row["Diagnosis"],
              discussMentalHealthProblems: row["Discuss Mental Health Problems"],
              responsibleEmployer: row["Responsible Employer"],
              disorder: row["Disorder"] === 1,
              primarilyTechEmployer: row["Primarily a Tech Employer"] === 1
            }));

            // Upload to backend
            const response = await apiRequest("POST", "/api/survey-data/bulk?clear=true", transformedData);
            
            if (response.ok) {
              // Fetch the updated data
              const dataResponse = await fetch("/api/survey-data", {
                credentials: "include",
              });
              
              if (dataResponse.ok) {
                const surveyData = await dataResponse.json();
                setData(surveyData);
                
                toast({
                  title: "Success",
                  description: `Uploaded ${surveyData.length} records successfully`,
                });

                // Invalidate queries to refresh data
                queryClient.invalidateQueries({ queryKey: ["/api/survey-data"] });
              }
            }
          } catch (error) {
            console.error("Upload error:", error);
            toast({
              title: "Upload failed",
              description: error instanceof Error ? error.message : "Unknown error occurred",
              variant: "destructive",
            });
          }
        },
        error: (error) => {
          toast({
            title: "Parse error",
            description: error.message,
            variant: "destructive",
          });
        }
      });
    } catch (error) {
      console.error("File processing error:", error);
      toast({
        title: "Error",
        description: "Failed to process the file",
        variant: "destructive",
      });
    }

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <BarChart3 className="h-6 w-6 text-primary mr-3" />
          <h1 className="text-xl font-bold text-primary dark:text-white">Mental Health in Tech</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
          <Button onClick={handleUploadClick} className="flex items-center">
            <Upload className="mr-2 h-4 w-4" />
            Upload Data
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv"
            className="hidden"
          />
        </div>
      </div>
    </header>
  );
}
