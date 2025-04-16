import { Button } from "@/components/ui/button";
import { Download, InfoIcon } from "lucide-react";
import { useDataContext } from "@/hooks/useDataContext";
import { useToast } from "@/hooks/use-toast";

interface FooterProps {
  onShowInfo: () => void;
}

export default function Footer({ onShowInfo }: FooterProps) {
  const { data } = useDataContext();
  const { toast } = useToast();

  const handleExportData = () => {
    if (!data || data.length === 0) {
      toast({
        title: "No data available",
        description: "Please upload data before exporting",
        variant: "destructive",
      });
      return;
    }

    try {
      // Convert data to CSV format
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(item => 
        Object.values(item).map(value => 
          typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
        ).join(',')
      );
      const csv = [headers, ...rows].join('\n');

      // Create a blob and download link
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'mental_health_tech_data.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export successful",
        description: "Data has been downloaded as CSV",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "An error occurred while exporting the data",
        variant: "destructive",
      });
    }
  };

  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Mental Health in Tech Dashboard - {new Date().getFullYear()}
            </p>
          </div>
          <div className="flex space-x-4">
            <Button 
              variant="ghost"
              size="sm"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary"
              onClick={handleExportData}
            >
              <Download className="mr-2 h-4 w-4" /> Export Data
            </Button>
            <Button 
              variant="ghost"
              size="sm"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary"
              onClick={onShowInfo}
            >
              <InfoIcon className="mr-2 h-4 w-4" /> About Dataset
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}
