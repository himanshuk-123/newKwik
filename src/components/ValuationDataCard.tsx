import { StyleSheet, View } from "react-native";
import React from "react";
// Using Gluestack UI or React Native components? 
// CLI App uses standard React Native mostly, let's stick to standard components for layout wrapper
// but inner components might need Gluestack if other components use it. 
// However, the prompt says "No new libraries". 
// Let's check what UI library CLI uses. Based on Dashboard, it uses standard StyleSheet.
// BUT Expo ValuationDataCard used GlueStack (Box, Text).
// I must refactor to standard React Native View/Text to avoid dependency issues if Gluestack isn't fully set up or to match CLI style.
// Checking `DashBoard.tsx`, it uses standard imports. 
// I will convert Box -> View, Text (Gluestack) -> Text (RN).

import { Text } from "react-native";

export interface ValuationDataCardProps {
  topLeftComponent?: React.ReactNode;
  topRightComponent?: React.ReactNode;
  bottomLeftComponent?: React.ReactNode;
  bottomRightComponent?: React.ReactNode;
  customStyle?: any;
}

export default function ValuationDataCard(props: ValuationDataCardProps) {
  const {
    bottomLeftComponent,
    bottomRightComponent,
    topLeftComponent,
    topRightComponent,
    customStyle,
  } = props;

  return (
    <View style={[styles.card, customStyle]}>
      <View style={styles.contentContainer}>
        <View style={styles.topContainer}>
          <View style={styles.topLeftWrapper}>
            {topLeftComponent}
          </View>
          <View style={styles.topRightWrapper}>
            {topRightComponent}
          </View>
        </View>

        <View style={styles.bottomContainer}>
          <View style={styles.bottomLeftWrapper}>
            {bottomLeftComponent}
          </View>
          <View style={styles.bottomRightWrapper}>
            {bottomRightComponent}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginVertical: 8,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 160,
  },
  contentContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  topContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    minHeight: 80,
  },
  topLeftWrapper: {
    flex: 1,
    marginRight: 10,
  },
  topRightWrapper: {
    alignItems: 'flex-end',
  },
  bottomContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 10,
  },
  bottomLeftWrapper: {
    flex: 1,
  },
  bottomRightWrapper: {
    flex: 1,
    alignItems: 'flex-end',
  },
});
