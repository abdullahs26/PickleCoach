import React, {FC} from "react";
import { View, Text, Modal, TouchableOpacity, FlatList, StyleSheet } from "react-native";

type ShotModalProps = {
  gameId: number
  visible: boolean;
  closeModal: () => void;
};

  const shotData = [
    {
      ShotType: "Drive",
      ShotAngle: 45,
      ShotSpeed: 120,
      HeatMapLoc: "Top Right",
    },
    { ShotType: "Dink", ShotAngle: 30, ShotSpeed: 60, HeatMapLoc: "Center" },
    {
      ShotType: "Drop",
      ShotAngle: 20,
      ShotSpeed: 50,
      HeatMapLoc: "Bottom Left",
    },
  ];
const ShotDataModal : FC<ShotModalProps> = (props) => {
  const { visible, closeModal, gameId } = props;
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent = {false}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Shot Data</Text>

          {/* Table Header */}
          <View style={styles.headerRow}>
            <Text style={styles.headerText}>Type</Text>
            <Text style={styles.headerText}>Angle</Text>
            <Text style={styles.headerText}>Speed</Text>
            <Text style={styles.headerText}>HeatMap</Text>
          </View>

          {/* Table Rows */}
          <FlatList
            data={shotData}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <Text style={styles.cell}>{item.ShotType}</Text>
                <Text style={styles.cell}>{item.ShotAngle}°</Text>
                <Text style={styles.cell}>{item.ShotSpeed} km/h</Text>
                <Text style={styles.cell}>{item.HeatMapLoc}</Text>
              </View>
            )}
          />

          {/* Close Button */}
          <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  modalContainer: {
    backgroundColor: "#DFF5E9",
    width: "80%",
    padding: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  title: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    color: "black",
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#999",
    paddingBottom: 5,
  },
  headerText: {
    fontWeight: "bold",
    color: "black",
    textAlign: "center",
    width: "25%",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 0.5,
    borderBottomColor: "#ccc",
    paddingVertical: 8,
  },
  cell: {
    textAlign: "center",
    color: "black",
    width: "25%",
  },
  closeButton: {
    backgroundColor: "#4CAF50",
    marginTop: 15,
    paddingVertical: 10,
    borderRadius: 10,
  },
  closeButtonText: {
    textAlign: "center",
    color: "white",
    fontWeight: "bold",
  },
});

export default ShotDataModal;
