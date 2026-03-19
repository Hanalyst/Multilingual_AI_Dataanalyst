import { useEffect, useState, useContext, useCallback } from "react";
import API from "../../services/api";
import { DatasetContext } from "../../context/DatasetContext";

function DatasetList() {
  const [datasets, setDatasets] = useState([]);
  const { datasetId, setDatasetId } = useContext(DatasetContext);

  const fetchDatasets = useCallback(async () => {
    try {
      const res = await API.get("/my-datasets");
      const seen = new Set();
      const unique = res.data.filter(d => {
        if (seen.has(d.name)) return false;
        seen.add(d.name);
        return true;
      });
      setDatasets(unique);
      if (!localStorage.getItem("dataset_id") && unique.length > 0) {
        setDatasetId(unique[0].id);
        localStorage.setItem("dataset_id", unique[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch datasets:", err);
    }
  }, [setDatasetId]);

  useEffect(() => { fetchDatasets(); }, [fetchDatasets]);

  const selectDataset = (dataset) => {
    setDatasetId(dataset.id);
    localStorage.setItem("dataset_id", dataset.id);
  };

  const deleteDataset = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Delete this dataset?")) return;
    try {
      await API.delete("/datasets/" + id);
      if (datasetId === id) {
        setDatasetId(null);
        localStorage.removeItem("dataset_id");
      }
      await fetchDatasets();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Could not delete dataset.");
    }
  };

  return (
    <div>
      <p className="section-label">Datasets</p>
      {datasets.length === 0 && (
        <p className="no-chats">No datasets yet</p>
      )}
      {datasets.map(d => (
        <div
          key={d.id}
          onClick={() => selectDataset(d)}
          className={"dataset-item" + (datasetId === d.id ? " active-dataset" : "")}
        >
          <span className="dataset-name">&#128202; {d.name}</span>
          <button
            className="dataset-delete-btn"
            onClick={(e) => deleteDataset(e, d.id)}
            title="Delete dataset"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4h6v2"/>
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

export default DatasetList;

