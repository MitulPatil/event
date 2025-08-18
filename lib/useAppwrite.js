import { Alert } from "react-native";
import { useEffect, useState } from "react";

const useAppwrite = (fn) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log("Fetching data with function:", fn.name);
      const res = await fn();
      console.log("Data fetched successfully:", res);
      setData(res);
    } catch (error) {
      console.log("Error in useAppwrite:", error);
      console.log("Error details:", JSON.stringify(error, null, 2));
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const refetch = () => fetchData();

  return { data, loading, refetch };
};

export default useAppwrite;
