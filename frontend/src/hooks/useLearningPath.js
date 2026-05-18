import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const BASE = (typeof import !== "undefined" ? (import.meta?.env?.VITE_API_BASE || "") : "") + "/api/learning-path";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export function useLearningPath() {
  const [path, setPath] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPath = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await axios.get(BASE, { headers: getAuthHeaders() });
      setPath(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load learning path");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPath();
  }, [fetchPath]);

  const rebuild = async () => {
    try {
      setLoading(true);
      const { data } = await axios.post(`${BASE}/rebuild`, {}, { headers: getAuthHeaders() });
      setPath(data.path);
    } catch (err) {
      setError("Rebuild failed");
    } finally {
      setLoading(false);
    }
  };

  return { path, loading, error, refetch: fetchPath, rebuild };
}

export function useEmotionHistory(topic = null, days = 30) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = { days };
    if (topic) params.topic = topic;

    axios
      .get(`${BASE}/emotion-history`, { params, headers: getAuthHeaders() })
      .then(({ data }) => setHistory(data))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [topic, days]);

  return { history, loading };
}

export function useTopicSummary() {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${BASE}/topic-summary`, { headers: getAuthHeaders() })
      .then(({ data }) => setSummary(data))
      .catch(() => setSummary([]))
      .finally(() => setLoading(false));
  }, []);

  return { summary, loading };
}

export function useBestStudyTime() {
  const [data, setData] = useState(null);

  useEffect(() => {
    axios
      .get(`${BASE}/best-time`, { headers: getAuthHeaders() })
      .then(({ data }) => setData(data))
      .catch(() => {});
  }, []);

  return data;
}

export async function logEmotionSession(payload) {
  try {
    const { data } = await axios.post(`${BASE}/session`, payload, {
      headers: getAuthHeaders(),
    });
    return data;
  } catch (err) {
    console.error("[AELP] Failed to log session:", err.message);
    return null;
  }
}