import React, { useState, useEffect, FC } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type SessionModalProps = {
  visible: boolean;
  closeModal: () => void;
};

const SessionModal : FC<SessionModalProps>  = (props) => {
  const { visible, closeModal } = props;
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);

  const closeSession = () => {
    setRunning(false)
    setSeconds(0)
    closeModal()
  }

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
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
    >
      <SafeAreaView style={styles.container}>
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
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#00C781", // Green background like the image
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    position: "absolute",
    top: 0,
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
});

export default SessionModal;
