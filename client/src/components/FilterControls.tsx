import { useDataContext } from "@/hooks/useDataContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useMemo, useState } from "react";
import { FilterState } from "@/types";

export default function FilterControls() {
  const { data, setFilterState, filterState, applyFilters } = useDataContext();
  
  const [years, setYears] = useState<string[]>([]);
  const [genders, setGenders] = useState<string[]>([]);
  const [companySizes, setCompanySizes] = useState<string[]>([]);
  const [ageGroups, setAgeGroups] = useState<string[]>([]);

  // Extract unique values for filter dropdowns
  useEffect(() => {
    if (data && data.length > 0) {
      const uniqueYears = Array.from(new Set(data.map(item => item.year))).filter(Boolean).sort();
      const uniqueGenders = Array.from(new Set(data.map(item => item.gender))).filter(Boolean).sort();
      const uniqueCompanySizes = Array.from(new Set(data.map(item => item.companySize))).filter(Boolean).sort();
      const uniqueAgeGroups = Array.from(new Set(data.map(item => item.ageGroup))).filter(Boolean).sort();
      
      setYears(uniqueYears);
      setGenders(uniqueGenders);
      setCompanySizes(uniqueCompanySizes);
      setAgeGroups(uniqueAgeGroups);
    }
  }, [data]);

  const handleFilterChange = (field: keyof FilterState, value: string | null) => {
    setFilterState((prev: FilterState) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleResetFilters = () => {
    setFilterState({
      year: null,
      gender: null,
      companySize: null,
      ageGroup: null
    });
  };

  return (
    <Card className="bg-white dark:bg-gray-800 mb-8 border border-gray-200 dark:border-gray-700">
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Filter Data</h3>
          <Button 
            variant="link" 
            className="mt-2 sm:mt-0 text-sm text-primary dark:text-blue-400 p-0 h-auto"
            onClick={handleResetFilters}
          >
            Reset Filters
          </Button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="year-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Year
            </Label>
            <Select
              value={filterState.year || "all"}
              onValueChange={(value) => handleFilterChange("year", value === "all" ? null : value)}
            >
              <SelectTrigger id="year-filter" className="w-full">
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="gender-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Gender
            </Label>
            <Select
              value={filterState.gender || "all"}
              onValueChange={(value) => handleFilterChange("gender", value === "all" ? null : value)}
            >
              <SelectTrigger id="gender-filter" className="w-full">
                <SelectValue placeholder="All Genders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                {genders.map(gender => (
                  <SelectItem key={gender} value={gender}>{gender}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="company-size-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Company Size
            </Label>
            <Select
              value={filterState.companySize || "all"}
              onValueChange={(value) => handleFilterChange("companySize", value === "all" ? null : value)}
            >
              <SelectTrigger id="company-size-filter" className="w-full">
                <SelectValue placeholder="All Sizes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sizes</SelectItem>
                {companySizes.map(size => (
                  <SelectItem key={size} value={size}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="age-group-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Age Group
            </Label>
            <Select
              value={filterState.ageGroup || "all"}
              onValueChange={(value) => handleFilterChange("ageGroup", value === "all" ? null : value)}
            >
              <SelectTrigger id="age-group-filter" className="w-full">
                <SelectValue placeholder="All Age Groups" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Age Groups</SelectItem>
                {ageGroups.map(ageGroup => (
                  <SelectItem key={ageGroup} value={ageGroup}>{ageGroup}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
