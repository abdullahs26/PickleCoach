import React, { useState, useEffect, FC } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LineChart } from "react-native-chart-kit";
import SkiaAccelChart from "../helper/skiaLineChart";
import SkiaLineChart from "../helper/skiaLineChart";

type SessionModalProps = {
  visible: boolean;
  closeModal: () => void;
  xAccelCoordinateData: any[];
  xGyroCoordinateData: any[];
  yAccelCoordinateData: any[];
  yGyroCoordinateData: any[];
  zAccelCoordinateData: any[];
  zGyroCoordinateData: any[];
};

const SessionModal: FC<SessionModalProps> = (props) => {
  const {
    visible,
    closeModal,
    xAccelCoordinateData,
    xGyroCoordinateData,
    yAccelCoordinateData,
    yGyroCoordinateData,
    zAccelCoordinateData,
    zGyroCoordinateData,
  } = props;
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);

  const closeSession = () => {
    setRunning(false);
    setSeconds(0);
    closeModal();
  };

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (visible && !running) {
      setRunning(true);
    } else if (!visible && running) {
      setRunning(false);
    }
    if (running) {
      timer = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timer) clearInterval(timer);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [visible, running]);

  const formatTime = (time: number) => {
    const hrs = Math.floor(time / 3600);
    const mins = Math.floor((time % 3600) / 60);
    const secs = time % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(
      2,
      "0"
    )}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <Modal animationType="slide" transparent={false} visible={visible}>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Session Timer</Text>
          </View>

          {/* Timer Display */}
          <View style={styles.card}>
            <Text style={styles.timerText}>{formatTime(seconds)}</Text>
            <TouchableOpacity
              style={styles.stopButton}
              onPress={closeSession}
              disabled={!running}
            >
              <Text style={styles.stopButtonText}>Stop Session</Text>
            </TouchableOpacity>
          </View>

          {/* Accelerometer Data */}
          {xAccelCoordinateData.length !== 0 &&
            yAccelCoordinateData.length !== 0 &&
            zAccelCoordinateData.length !== 0 && (
              <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>Accelerometer Data</Text>
                <SkiaLineChart
                  xAccelCoordinateData={xAccelCoordinateData}
                  yAccelCoordinateData={yAccelCoordinateData}
                />
              </View>
            )}

          {/* Gyroscope Data */}
          {xGyroCoordinateData.length !== 0 &&
            yGyroCoordinateData.length !== 0 &&
            zGyroCoordinateData.length !== 0 && (
              <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>Gyroscope Data</Text>
                <SkiaLineChart
                  xAccelCoordinateData={xGyroCoordinateData}
                  yAccelCoordinateData={yGyroCoordinateData}
                />
              </View>
            )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const chartConfig = {
  backgroundColor: "#e26a00",
  backgroundGradientFrom: "#fb8c00",
  backgroundGradientTo: "#ffa726",
  decimalPlaces: 2,
  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  style: { borderRadius: 16 },
  propsForDots: { r: "6", strokeWidth: "2", stroke: "#ffa726" },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#00C781",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
    alignItems: "center",
  },
  header: {
    width: "100%",
    padding: 20,
    alignItems: "center",
    backgroundColor: "#00C781",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
  },
  card: {
    backgroundColor: "#fff",
    width: "85%",
    padding: 30,
    borderRadius: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginVertical: 15,
  },
  timerText: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  stopButton: {
    backgroundColor: "#FF5252",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginTop: 10,
  },
  stopButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  chartContainer: {
    backgroundColor: "#fff",
    padding: 15,
    marginVertical: 10,
    marginHorizontal: 20,
    borderRadius: 10,
    elevation: 3,
    width: "90%",
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  chart: {
    borderRadius: 10,
  },
});

export default SessionModal;
