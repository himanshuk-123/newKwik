import {
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Text,
  Image,
} from "react-native";
// import { COLORS } from "../constants/Colors";
import { useNavigation } from "@react-navigation/native";
// import { SingleCardType } from "../../@types";
import { HandHoldingImage } from '../assets'
import { COLORS } from "../constants/Colors";
// @ts-ignore
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
// @ts-ignore
import Feather from "react-native-vector-icons/Feather";
// import useZustandStore from "@src/store/useZustandStore";

interface SingleCardType {
  id: string;
  regNo?: string;
  vehicleName: string;
  requestId: string;
  mode?: string;
  client: string;
  companyName: string;
  isCash: boolean;
  chassisNo: string;
  location: string;
  vehicleStatus: string;
  vehicleType?: string;
  engineNo?: string;
  cashToBeCollected?: string | number;
  make?: string;
  model?: string;
  vehicleFuelType?: string;
  ownershipType?: string;
  HPAStatus?: string;
  mobileNumber?: string;
  leadType?: string;
  leadId?: string | number;
}

type Props = {
  data: SingleCardType;
  vehicleType: string;
  onValuateClick: () => void;
  onAppointmentClick: () => void;
};
type CardTileProps = { textPrimary: string; textSecondary: string };

const CardTile = ({ textPrimary, textSecondary }: CardTileProps) => {
  const RenderIcon = () => {
    const iconSize = 20;
    const iconColor = "#000";

    switch (textPrimary) {
      case "Request Id":
        return (
          <MaterialCommunityIcons
            name="clipboard-text-outline"
            size={iconSize}
            color={iconColor}
            style={{ marginRight: 10 }}
          />
        );
      case "Chassis No.":
        return (
          <MaterialCommunityIcons
            name="car"
            size={iconSize}
            color={iconColor}
            style={{ marginRight: 10 }}
          />
        );
      case "Client":
        return (
          <Feather
            name="phone"
            size={iconSize}
            color={iconColor}
            style={{ marginRight: 10 }}
          />
        );
      case "Customer":
        return (
          <Feather
            name="user"
            size={iconSize}
            color={iconColor}
            style={{ marginRight: 10 }}
          />
        );
      case "Location":
        return (
          <Feather
            name="map-pin"
            size={iconSize}
            color={iconColor}
            style={{ marginRight: 10 }}
          />
        );
    }
  };
  return (
    <View style={cardTile.container}>
      <RenderIcon />
      <Text style={cardTile.textPrimary}>{textPrimary}</Text>
      <Text
        style={[
          cardTile.textSecondary,
          {
            maxWidth: "60%",
          },
        ]}
      >
        {textSecondary}
      </Text>
    </View>
  );
};

const SingleCard = (props: Props) => {
  // const navigation = useNavigation();
  // const { setMyTaskValuate } = useZustandStore();
  const isRepoCase = props.data.leadType?.toLowerCase() === "repo";
  const navigation = useNavigation();
  return (
    <View style={cardTile.card}>
      <TouchableWithoutFeedback>
        <View style={styles.topContainer}>
          <Text style={styles.topLeftContainer}>{props.data.regNo}</Text>
          <Text style={styles.vehicleNameText}>
            {props.data.vehicleName}
          </Text>
        </View>
      </TouchableWithoutFeedback>
      <TouchableWithoutFeedback>
        <View style={{ paddingVertical: 10 }}>
          <View style={cardTile.body}>
            <CardTile
              textPrimary="Request Id"
              textSecondary={props.data.requestId}
            />
            <CardTile
              textPrimary="Client"
              textSecondary={
                isRepoCase ? props.data.client : props.data.companyName
              }
            />

            {isRepoCase ? (
              <CardTile
                textPrimary="Chassis No."
                textSecondary={props.data.chassisNo}
              />
            ) : (
              <CardTile
                textPrimary="Customer"
                textSecondary={props.data.client}
              />
            )}

            {isRepoCase ? (
              <CardTile
                textPrimary="Location"
                textSecondary={props.data.location}
              />
            ) : (
              <CardTile
                textPrimary="Location"
                textSecondary={props.data.location}
              />
            )}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.outlineButton}
              onPress={() => props.onAppointmentClick && props.onAppointmentClick()}
            >
              <Text style={styles.outlineButtonText}>Appointment</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                console.log("props.data", props.data);
                if (props.onValuateClick) {
                  props.onValuateClick();
                } else {
                  // Fallback or explicit error if needed, but avoiding hardcoded navigation that uses wrong params
                  console.log("onValuateClick not provided");
                }
              }}
            >
              <Text style={styles.primaryButtonText}>Valuate</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
      <TouchableWithoutFeedback>
        <View style={cardTile.status}>
          <View style={cardTile.statusInner} />
        </View>
      </TouchableWithoutFeedback>
      <View style={styles.iconContainer}>
        <View style={styles.iconStack}>
          <TouchableOpacity>
            <Feather name="phone-call" size={24} color={COLORS.AppTheme.primary} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Feather name="edit" size={24} color={COLORS.AppTheme.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {props.data.isCash && (
        <View style={styles.iconTextContainer}>
          <View style={styles.cashContainer}>
            <View style={styles.cashRow}>
              <Text style={styles.cashAmount}>
                ₹ {props.data.cashToBeCollected}
              </Text>
              <Image
                style={styles.handImage}
                source={HandHoldingImage}
              />
            </View>
            <Text style={styles.cashLabel}>Cash to be collected</Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default SingleCard;

const styles = StyleSheet.create({
  topContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginRight: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  iconContainer: {
    position: "absolute",
    top: 12,
    right: 12,
  },
  iconStack: {
    gap: 8,
  },
  iconTextContainer: {
    position: "absolute",
    bottom: 12,
    left: 12,
  },
  cashContainer: {
    justifyContent: "center",
  },
  cashRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  cashAmount: {
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 8,
  },
  handImage: {
    width: 25,
    height: 25,
  },
  cashLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.AppTheme.success,
  },
  topLeftContainer: {
    backgroundColor: "#f0f0f0",
    borderBottomRightRadius: 5,
    borderTopLeftRadius: 5,
    minWidth: "10%",
    maxWidth: "40%",
    paddingLeft: 15,
    paddingRight: 10,
    paddingVertical: 5,
    marginRight: 10,
    flexShrink: 0,
  },
  vehicleNameText: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    flexWrap: "wrap",
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  outlineButton: {
    borderWidth: 1.5,
    borderColor: COLORS.secondary,
    borderRadius: 6,
    paddingVertical: 7,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
  },
  outlineButtonText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "600",
  },
  primaryButton: {
    backgroundColor: COLORS.Dashboard.text.Blue,
    borderRadius: 6,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
  },
});

const cardTile = StyleSheet.create({
  card: {
    padding: 0,
    minHeight: 50,
    marginBottom: 8,
    marginHorizontal: 4,
    position: "relative",
    backgroundColor: "white",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
  },
  body: {
    paddingVertical: 4,
    paddingLeft: 10,
    gap: 4,
  },
  textPrimary: {
    fontWeight: "600",
    color: COLORS.primary,
    minWidth: 75,
    maxWidth: 95,
    marginRight: 8,
    fontSize: 13,
  },
  textSecondary: {
    color: "#333",
    fontWeight: "600",
    fontSize: 13,
  },
  status: {
    width: 5,
    height: "100%",
    position: "absolute",
    top: 0,
    right: 0,
    borderRadius: 75,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  statusInner: {
    backgroundColor: "red",
    width: 5,
    height: "90%",
    position: "absolute",
    top: 13,
    right: 0,
    borderRadius: 75,
  },
});
