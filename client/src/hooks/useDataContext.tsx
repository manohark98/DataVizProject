import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { SurveyRecord, FilterState } from "@/types";
import { useQuery } from "@tanstack/react-query";

interface DataContextType {
  data: SurveyRecord[] | null;
  setData: (data: SurveyRecord[] | null) => void;
  filteredData: SurveyRecord[] | null;
  filterState: FilterState;
  setFilterState: (state: FilterState) => void;
  applyFilters: () => void;
  isLoading: boolean;
}

const defaultFilterState: FilterState = {
  year: null,
  gender: null,
  companySize: null,
  ageGroup: null
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SurveyRecord[] | null>(null);
  const [filteredData, setFilteredData] = useState<SurveyRecord[] | null>(null);
  const [filterState, setFilterState] = useState<FilterState>(defaultFilterState);

  // Fetch data from API
  const { data: apiData, isLoading } = useQuery({
    queryKey: ["/api/survey-data"],
    staleTime: Infinity,
  });

  // Set data from API
  useEffect(() => {
    if (apiData) {
      setData(apiData);
      setFilteredData(apiData);
    }
  }, [apiData]);

  // Apply filters when filterState changes
  useEffect(() => {
    applyFilters();
  }, [filterState, data]);

  const applyFilters = () => {
    if (!data) return;

    let filtered = [...data];

    // Apply year filter
    if (filterState.year) {
      filtered = filtered.filter(item => item.year === filterState.year);
    }

    // Apply gender filter
    if (filterState.gender) {
      filtered = filtered.filter(item => item.gender === filterState.gender);
    }

    // Apply company size filter
    if (filterState.companySize) {
      filtered = filtered.filter(item => item.companySize === filterState.companySize);
    }

    // Apply age group filter
    if (filterState.ageGroup) {
      filtered = filtered.filter(item => item.ageGroup === filterState.ageGroup);
    }

    setFilteredData(filtered);
  };

  return (
    <DataContext.Provider 
      value={{ 
        data, 
        setData, 
        filteredData, 
        filterState, 
        setFilterState,
        applyFilters,
        isLoading
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useDataContext() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useDataContext must be used within a DataProvider");
  }
  return context;
}
