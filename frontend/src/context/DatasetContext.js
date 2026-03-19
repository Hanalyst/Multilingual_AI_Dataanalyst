import { createContext, useState } from "react";

export const DatasetContext = createContext();

export const DatasetProvider = ({ children }) => {

  const [datasetId, setDatasetId] = useState(
    localStorage.getItem("dataset_id") || null
  );

  return (
    <DatasetContext.Provider value={{ datasetId, setDatasetId }}>
      {children}
    </DatasetContext.Provider>
  );

};