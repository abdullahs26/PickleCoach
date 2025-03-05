import React from "react";
import { View, Dimensions, Text, StyleSheet } from "react-native";
import { Skia, Canvas, Path, Paint } from "@shopify/react-native-skia";

type AccelChartProps = {
  xAccelCoordinateData: any[];
  yAccelCoordinateData: any[];
};

const SkiaLineChart: React.FC<AccelChartProps> = ({
  xAccelCoordinateData,
  yAccelCoordinateData,
}) => {
  const width = Dimensions.get("window").width - 80;
  const height = 200;

  const getNormalizedY = (value: number) => {
    const minY = Math.min(
      ...[...xAccelCoordinateData, ...yAccelCoordinateData]
    );
    const maxY = Math.max(
      ...[...xAccelCoordinateData, ...yAccelCoordinateData]
    );

    if (maxY === minY) return height / 2;

    return height - ((value - minY) / (maxY - minY)) * height;
  };

  const createPath = (data: any[], color: string) => {
    if (data.length === 0) return null;
    const path = Skia.Path.Make();
    path.moveTo(0, getNormalizedY(data[0]));
    data.forEach((point, index) => {
      path.lineTo((index / data.length) * width, getNormalizedY(point));
    });
    return <Path path={path} strokeWidth={2} color={color} style="stroke" />;
  };

  const renderDataLabels = (data: any[], color: string) => {
    return data.map((point, index) => {
      const x = (index / data.length) * width;
      const y = getNormalizedY(point);
      return (
        <Text
          key={index}
          style={[
            styles.dataLabel,
            { left: x - 10, top: y - 10, color }, // Adjust position for better visibility
          ]}
        >
          {point.toFixed(2)} {/* Display the value with 2 decimal places */}
        </Text>
      );
    });
  };

  return (
    <View style={styles.chartContainer}>
      <Canvas style={{ width, height }}>
        <Paint>
          {createPath(xAccelCoordinateData, "#028fdb")}
          {createPath(yAccelCoordinateData, "#ED7C33")}
        </Paint>
      </Canvas>
      {renderDataLabels(xAccelCoordinateData, "#028fdb")}
      {renderDataLabels(yAccelCoordinateData, "#ED7C33")}
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    position: "relative", // Ensures that the text labels are correctly positioned within the container
  },
  dataLabel: {
    position: "absolute",
    fontSize: 12,
    fontWeight: "bold",
    backgroundColor: "transparent",
  },
});

export default SkiaLineChart;
