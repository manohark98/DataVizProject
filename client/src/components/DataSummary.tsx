import { useDataContext } from "@/hooks/useDataContext";
import { SummaryStatistic } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Heart, Award, Globe } from "lucide-react";
import { useMemo } from "react";

export default function DataSummary() {
  const { data, filteredData } = useDataContext();

  const summaryStats: SummaryStatistic[] = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return [
        { label: "Total Respondents", value: "0", icon: "Users", color: "primary" },
        { label: "Sought Treatment", value: "0%", icon: "Heart", color: "secondary" },
        { label: "Family History", value: "0%", icon: "Award", color: "accent" },
        { label: "Countries", value: "0", icon: "Globe", color: "red-500" },
      ];
    }

    // Calculate summary statistics from filtered data
    const totalRespondents = filteredData.length;
    
    const soughtTreatment = filteredData.filter(record => record.soughtTreatment).length;
    const soughtTreatmentPercentage = Math.round((soughtTreatment / totalRespondents) * 100);
    
    const familyHistory = filteredData.filter(record => record.familyHistory === "Yes").length;
    const familyHistoryPercentage = Math.round((familyHistory / totalRespondents) * 100);
    
    const uniqueCountries = new Set(filteredData.map(record => record.location)).size;
    
    return [
      { label: "Total Respondents", value: totalRespondents.toString(), icon: "Users", color: "primary" },
      { label: "Sought Treatment", value: `${soughtTreatmentPercentage}%`, icon: "Heart", color: "secondary" },
      { label: "Family History", value: `${familyHistoryPercentage}%`, icon: "Award", color: "accent" },
      { label: "Countries", value: uniqueCountries.toString(), icon: "Globe", color: "red-500" },
    ];
  }, [filteredData]);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "Users":
        return <Users className="text-primary text-xl" />;
      case "Heart":
        return <Heart className="text-secondary text-xl" />;
      case "Award":
        return <Award className="text-amber-500 text-xl" />;
      case "Globe":
        return <Globe className="text-red-500 text-xl" />;
      default:
        return <Users className="text-primary text-xl" />;
    }
  };

  return (
    <section className="mb-8">
      <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Summary Statistics</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats.map((stat, index) => (
          <Card key={index} className="border border-gray-200 dark:border-gray-700">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 bg-${stat.color}/10 rounded-full flex items-center justify-center`}>
                  {getIcon(stat.icon)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
