import React, {RefObject} from 'react';
import {StyleSheet, View} from 'react-native';
import {Camera, CameraDevice} from 'react-native-vision-camera';
import Svg, {Rect, Text as SvgText, Line} from 'react-native-svg';

interface ScanResult {
  medication: string;
  confidence: number;
  verified: boolean;
}

interface Props {
  device: CameraDevice;
  cameraRef: RefObject<Camera>;
  result: ScanResult | null;
}

// Frame dimensions as percentages of viewport
const FRAME = {x: '10%', y: '20%', w: '80%', h: '55%'};

export default function CameraPreview({device, cameraRef, result}: Props) {
  const frameColor = result
    ? result.verified
      ? '#4caf50'
      : '#ff9800'
    : '#2196f3';

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive
        photo
      />

      <Svg style={StyleSheet.absoluteFill}>
        {/* Corner brackets instead of full dashed rect for cleaner look */}
        {cornerBrackets(frameColor)}

        {/* Result overlay */}
        {result && (
          <>
            <Rect
              x="15%"
              y="78%"
              width="70%"
              height="10%"
              rx={6}
              fill="rgba(0,0,0,0.7)"
            />
            <SvgText
              x="50%"
              y="84%"
              textAnchor="middle"
              fill={result.verified ? '#4caf50' : '#ff9800'}
              fontSize={15}
              fontWeight="bold">
              {result.medication} — {Math.round(result.confidence * 100)}%
            </SvgText>
          </>
        )}
      </Svg>
    </View>
  );
}

// Draws 4 corner L-brackets around the scan frame
function cornerBrackets(color: string) {
  const len = 30; // pixel length of each bracket arm
  // Approximate positions in a 375-wide viewport
  const corners = [
    // top-left
    {x1: 38, y1: 160 + len, x2: 38, y2: 160, x3: 38 + len, y3: 160},
    // top-right
    {x1: 337 - len, y1: 160, x2: 337, y2: 160, x3: 337, y3: 160 + len},
    // bottom-left
    {x1: 38, y1: 490 - len, x2: 38, y2: 490, x3: 38 + len, y3: 490},
    // bottom-right
    {
      x1: 337 - len,
      y1: 490,
      x2: 337,
      y2: 490,
      x3: 337,
      y3: 490 - len,
    },
  ];

  return corners.map((c, i) => (
    <React.Fragment key={i}>
      <Line
        x1={c.x1}
        y1={c.y1}
        x2={c.x2}
        y2={c.y2}
        stroke={color}
        strokeWidth={3}
      />
      <Line
        x1={c.x2}
        y1={c.y2}
        x2={c.x3}
        y2={c.y3}
        stroke={color}
        strokeWidth={3}
      />
    </React.Fragment>
  ));
}

const styles = StyleSheet.create({
  container: {flex: 1},
});
