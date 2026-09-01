import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import {
  Canvas,
  Circle,
  Path,
  Skia,
} from "@shopify/react-native-skia";
import { colors } from "../../utils/Colors";
import { fonts } from "../../utils/typography";

const SCREEN_WIDTH = Dimensions.get("window").width;

// 👇 fixed height from design
const GRAPH_HEIGHT = 190.82;

// 👇 width adapts but never exceeds height
const GRAPH_SIZE = Math.min(SCREEN_WIDTH * 0.45, GRAPH_HEIGHT);

// dynamic stroke
const STROKE = GRAPH_SIZE * 0.16;
const RADIUS = (GRAPH_SIZE - STROKE) / 2;
const CENTER = GRAPH_SIZE / 2;

function arc(size, stroke, startAngle, sweep) {
  const p = Skia.Path.Make();
  p.addArc(
    {
      x: stroke / 2,
      y: stroke / 2,
      width: size - stroke,
      height: size - stroke,
    },
    startAngle,
    sweep
  );
  return p;
}

export default function Graph() {
  return (
    <View style={[styles.container, { width: GRAPH_SIZE, height: GRAPH_SIZE }]}>
      <Canvas style={{ width: GRAPH_SIZE, height: GRAPH_SIZE }}>
        {/* Base Ring */}
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          style="stroke"
          strokeWidth={STROKE}
          color="#395299"
        />

        <Path
          path={arc(GRAPH_SIZE, STROKE, 170, 60)}
          style="stroke"
          strokeWidth={STROKE}
          strokeCap="round"
          color="#4C6ABD"
        />

        <Path
          path={arc(GRAPH_SIZE, STROKE, 240, 60)}
          style="stroke"
          strokeWidth={STROKE}
          strokeCap="round"
          color="#5B77C2"
        />

        <Path
          path={arc(GRAPH_SIZE, STROKE, 280, 95)}
          style="stroke"
          strokeWidth={STROKE}
          strokeCap="round"
          color="#6A83C8"
        />

        <Path
          path={arc(GRAPH_SIZE, STROKE, 380, 60)}
          style="stroke"
          strokeWidth={STROKE}
          strokeCap="round"
          color="#889CD3"
        />

        <Path
          path={arc(GRAPH_SIZE, STROKE, 60, 55)}
          style="stroke"
          strokeWidth={STROKE}
          strokeCap="round"
          color="#D2DAEE"
        />

        {/* Inner White */}
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS - STROKE / 2 + 2}
          color="white"
        />
      </Canvas>

      {/* Center Text */}
      <View style={styles.center}>
        <Text allowFontScaling={false} style={styles.title}>Your</Text>
        <Text allowFontScaling={false} style={styles.title}>Achievement</Text>

        <Text allowFontScaling={false} style={styles.value}>0.0(Lac)</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },

  center: {
    position: "absolute",
    alignItems: "center",
  },

  title: {
    fontSize: 13,
    color: colors.black,
    fontFamily: fonts.InterRegular,
  },

  value: {
    marginTop: 6,
    fontSize: 17,
    color: colors.blue,
    opacity:0.8,
    fontFamily: fonts.InterExtraBold,
  },
});
