import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DataSummary from "@/components/DataSummary";
import FilterControls from "@/components/FilterControls";
import GenderDistributionChart from "@/components/visualizations/GenderDistributionChart";
import CompanySizeChart from "@/components/visualizations/CompanySizeChart";
import GeographicDistributionChart from "@/components/visualizations/GeographicDistributionChart";
import FamilyHistoryTreatmentChart from "@/components/visualizations/FamilyHistoryTreatmentChart";
import AgeGroupDistributionChart from "@/components/visualizations/AgeGroupDistributionChart";
import TreatmentSeekingChart from "@/components/visualizations/TreatmentSeekingChart";
import MentalHealthTreeChart from "@/components/visualizations/MentalHealthTreeChart";
import MentalHealthNetworkGraph from "@/components/visualizations/MentalHealthNetworkGraph";

import DatasetInfoModal from "@/components/DatasetInfoModal";
import { useDataContext } from "@/hooks/useDataContext";

export default function Dashboard() {
  const [showDatasetInfo, setShowDatasetInfo] = useState(false);
  const { data, isLoading } = useDataContext();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Dashboard Introduction */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Mental Health in Tech Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-3xl">
            Explore data from a 2014 to 2019 survey that measures attitudes towards mental health and frequency of mental health disorders in the tech workplace.
          </p>
        </div>

        {/* Data Summary Cards */}
        <DataSummary />

        {/* Filter Controls */}
        <FilterControls />

        {/* Advanced Visualizations */}
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4">Advanced Visualizations</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <MentalHealthTreeChart />
            <MentalHealthNetworkGraph />
          </div>
        </div>


        {/* Standard Visualization Grid */}
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4">Standard Visualizations</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <GenderDistributionChart />
            <CompanySizeChart />
            <GeographicDistributionChart />
            <FamilyHistoryTreatmentChart />
            <AgeGroupDistributionChart />
            <TreatmentSeekingChart />
          </div>
        </div>
      </main>

      <Footer onShowInfo={() => setShowDatasetInfo(true)} />
      
      <DatasetInfoModal 
        isOpen={showDatasetInfo}
        onClose={() => setShowDatasetInfo(false)}
      />
    </div>
  );
}
