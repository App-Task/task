import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  I18nManager,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { getToken } from "../../services/authStorage";
import CountryPicker from "react-native-country-picker-modal";
import i18n from "i18next";
import { SafeAreaView } from "react-native-safe-area-context";


export default function EditProfileScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const isRTL = I18nManager.isRTL || i18n.language?.startsWith("ar");
  const scrollRef = useRef(null);


  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
const [location, setLocation] = useState("");
const [selectedSkills, setSelectedSkills] = useState([]);
const [about, setAbout] = useState("");
const [descriptionY, setDescriptionY] = useState(0);

// ✅ Temporary debugging to track skills changes
useEffect(() => {
  console.log('🔍 Skills state changed to:', selectedSkills);
}, [selectedSkills]);

// ✅ Robust skills update function
const updateSkills = (newSkills) => {
  console.log('🔄 Updating skills from:', selectedSkills, 'to:', newSkills);
  setSelectedSkills([...newSkills]); // Create new array reference
};

// ✅ New phone-related state
const [countryCode, setCountryCode] = useState("SA");
const [callingCode, setCallingCode] = useState("+966");
const [rawPhone, setRawPhone] = useState("");

// Dropdown states
const [showGenderDropdown, setShowGenderDropdown] = useState(false);
const [showLocationDropdown, setShowLocationDropdown] = useState(false);
const [showSkillsDropdown, setShowSkillsDropdown] = useState(false);

// Helper function to translate skill names
const getSkillTranslation = (skill) => {
  const skillMap = {
    "Handyman": t("clientPostTask.categories.handyman"),
    "Moving": t("clientPostTask.categories.moving"),
    "IKEA Assembly": t("clientPostTask.categories.furniture"),
    "Cleaning": t("clientPostTask.categories.cleaning"),
    "Shopping & Delivery": t("clientPostTask.categories.shopping"),
    "Yardwork Services": t("clientPostTask.categories.yardwork"),
    "Dog Walking": t("clientPostTask.categories.dogWalking"),
    "Other": t("clientPostTask.categories.other"),
  };
  
  let translated = skillMap[skill] || skill;
  
  // Fallback if translation returned the key itself
  if (translated.startsWith("clientPostTask.categories.")) {
    const fallbackMap = {
      "Handyman": i18n.language === "ar" ? "أعمال الصيانة" : "Handyman",
      "Moving": i18n.language === "ar" ? "النقل" : "Moving",
      "IKEA Assembly": i18n.language === "ar" ? "تركيب الأثاث" : "Furniture Assembly",
      "Cleaning": i18n.language === "ar" ? "التنظيف" : "Cleaning",
      "Shopping & Delivery": i18n.language === "ar" ? "التسوق والتوصيل" : "Shopping & Delivery",
      "Yardwork Services": i18n.language === "ar" ? "أعمال الحديقة" : "Yardwork Services",
      "Dog Walking": i18n.language === "ar" ? "تمشية الكلاب" : "Dog Walking",
      "Other": i18n.language === "ar" ? "أخرى" : "Other",
    };
    return fallbackMap[skill] || skill;
  }
  
  return translated;
};

// Helper function to reverse lookup - find English skill name from translated name
const getEnglishSkillName = (translatedSkill) => {
  const reverseMap = {
    [t("clientPostTask.categories.handyman")]: "Handyman",
    [t("clientPostTask.categories.moving")]: "Moving",
    [t("clientPostTask.categories.furniture")]: "IKEA Assembly",
    [t("clientPostTask.categories.cleaning")]: "Cleaning",
    [t("clientPostTask.categories.shopping")]: "Shopping & Delivery",
    [t("clientPostTask.categories.yardwork")]: "Yardwork Services",
    [t("clientPostTask.categories.dogWalking")]: "Dog Walking",
    [t("clientPostTask.categories.other")]: "Other",
  };
  
  return reverseMap[translatedSkill] || translatedSkill;
};

// Predefined skills list (English names for backend)
const availableSkills = [
  "Handyman",
  "Moving",
  "IKEA Assembly",
  "Cleaning",
  "Shopping & Delivery",
  "Yardwork Services",
  "Dog Walking",
  "Other"
];

// Get translated skills for display
const getTranslatedSkills = () => {
  return availableSkills.map(skill => getSkillTranslation(skill));
};

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await getToken();
        const res = await fetch("https://task-kq94.onrender.com/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (res.ok) {
          setName(data.name || "");
          setEmail(data.email || "");
          setGender(data.gender || "");
          setLocation(data.location || "");
          
          // Load skills exactly like CompleteTaskerProfileScreen
          console.log('🔄 Loading skills from backend:', data.skills);
          const skillsArray = data.skills ? data.skills.split(",").map(s => s.trim()).filter(s => s !== "") : [];
          console.log('🔄 Parsed skills array:', skillsArray);
          setSelectedSkills(skillsArray);
          
          setAbout(data.about || "");


          // ✅ Load phone details
        if (data.callingCode && data.rawPhone) {
          setCallingCode(data.callingCode);
          setRawPhone(data.rawPhone);
          setCountryCode(data.countryCode || "SA");
        } else if (data.phone) {
          const match = data.phone.match(/^\+(\d{1,4})(.*)$/);
          if (match) {
            setCallingCode("+" + match[1]);
            setRawPhone(match[2].trim());
            setCountryCode("SA"); // fallback
          }
        }

        } else {
          console.error("❌ Failed to fetch profile:", data.msg);
        }
      } catch (err) {
        console.error("❌ Error loading profile:", err.message);
      }
    };

    fetchProfile();

    // Add keyboard listeners for better handling
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        // When keyboard shows, ensure we can scroll to the description field
        setTimeout(() => {
          if (descriptionY > 0) {
            scrollRef.current?.scrollTo({ y: Math.max(0, descriptionY - 150), animated: true });
          }
        }, 100);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        // When keyboard hides, scroll back to top
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      }
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []); // ✅ Remove descriptionY dependency - only run once on mount

  const handleSave = async () => {
    if (!name || !gender || !location || !selectedSkills.length || !about) {
      Alert.alert(
        t("taskerEditProfile.incompleteTitle"),
        t("taskerEditProfile.incompleteMessage")
      );
      return;
    }
  
    // ✅ Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert(t("taskerEditProfile.invalidEmailTitle"), t("taskerEditProfile.invalidEmailMessage"));
      return;
    }
  
    // ✅ Phone number validation (8–15 digits)
    const phoneRegex = /^[0-9]{8,15}$/;
    if (!phoneRegex.test(rawPhone.trim())) {
      Alert.alert(t("taskerEditProfile.invalidPhoneTitle"), t("taskerEditProfile.invalidPhoneMessage"));
      return;
    }
  
    try {
      const token = await getToken();
      const res = await fetch("https://task-kq94.onrender.com/api/auth/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          gender,
          location,
          skills: selectedSkills.join(","), // ✅ convert array to comma-separated string
          about,
          phone: `${callingCode}${rawPhone.trim()}`,
          countryCode,
          callingCode,
          rawPhone: rawPhone.trim(),
        }),
      });
  
      const data = await res.json();
      if (res.ok) {
        Alert.alert(t("taskerEditProfile.updateSuccessTitle"), t("taskerEditProfile.updateSuccessMessage"), [
          {
            text: t("taskerEditProfile.ok"),
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        console.error("❌ Update failed:", data);
        Alert.alert(t("taskerEditProfile.errorTitle"), data.msg || t("taskerEditProfile.updateFailedMessage"));
      }
    } catch (err) {
      console.error("❌ Error saving profile:", err.message);
      Alert.alert(t("taskerEditProfile.errorTitle"), t("taskerEditProfile.generalErrorMessage"));
    }
  };
  
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        enabled={true}
      >
        <ScrollView 
          ref={scrollRef}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
          contentInsetAdjustmentBehavior="automatic"
          contentInset={{ bottom: 50 }}
          style={{ flex: 1 }}
        >
          {/* ✅ Top Back Button and Title */}
          <View style={styles.headerContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons
                name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"}
                size={24}
                color="#215433"
              />
            </TouchableOpacity>

            <Text style={styles.header}>{t("taskerEditProfile.title")}</Text>
          </View>


    <Text style={{ fontSize: 16, fontWeight: "bold", color: "#215433", marginBottom: 20, textAlign: I18nManager.isRTL ? "right" : "left" }}>
      {t("taskerEditProfile.instruction")}
    </Text>




          {/* Inputs */}
          <TextInput
    style={styles.input}
    value={name}
    onChangeText={setName}
    placeholder={t("taskerEditProfile.name") || "Name"}
    textAlign={I18nManager.isRTL ? "right" : "left"}
    placeholderTextColor="#999"
    maxLength={50} // ✅ add this line
  />

          <TextInput style={styles.input} value={email} editable={false} placeholder={t("taskerEditProfile.email") || "Email"} textAlign={I18nManager.isRTL ? "right" : "left"} placeholderTextColor="#999" />
          <View style={styles.phoneContainer}>
            <View style={styles.countryPickerWrapper}>
              <CountryPicker
                countryCode={countryCode}
                withFilter
                withFlag
                withCallingCodeButton
                withCountryNameButton={false} // ✅ hides country name
                withEmoji
                onSelect={(country) => {
                  setCountryCode(country.cca2);
                  setCallingCode("+" + country.callingCode[0]);
                }}
              />
            </View>
            <TextInput
              style={styles.phoneInput}
              value={rawPhone}
              onChangeText={setRawPhone}
              keyboardType="phone-pad"
              placeholder={t("register.phone") || "Phone Number"}
              placeholderTextColor="#999"
            />
          </View>

          {/* Gender Dropdown */}
          <View style={{ marginBottom: 20 }}>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowGenderDropdown(!showGenderDropdown)}
            >
              <Text style={{ color: gender ? "#333" : "#999" }}>
                {gender || "Select Gender"}
              </Text>
            </TouchableOpacity>

            {showGenderDropdown && (
              <View style={styles.dropdown}>
                {["Male", "Female"].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setGender(option);
                      setShowGenderDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Location Dropdown */}
          <View style={{ marginBottom: 20 }}>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowLocationDropdown(!showLocationDropdown)}
            >
              <Text style={{ color: location ? "#333" : "#999" }}>
                {location || "Select Location"}
              </Text>
            </TouchableOpacity>

            {showLocationDropdown && (
              <View style={styles.dropdown}>
                {["Bahrain"].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setLocation(option);
                      setShowLocationDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Skills Multi-Select Dropdown */}
          <View style={{ marginBottom: 20 }}>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowSkillsDropdown(!showSkillsDropdown)}
            >
              <Text style={{ color: selectedSkills.length > 0 ? "#333" : "#999" }}>
                {selectedSkills.length > 0 ? selectedSkills.map(s => getSkillTranslation(s)).join(", ") : "Select Skills"}
              </Text>
            </TouchableOpacity>

            {/* Display selected skills with remove buttons */}
            {selectedSkills.length > 0 && (
              <View style={styles.selectedSkillsContainer}>
                {selectedSkills.map((skill, index) => (
                  <View key={index} style={styles.selectedSkillItem}>
                    <Text style={styles.selectedSkillText}>{getSkillTranslation(skill)}</Text>
                    <TouchableOpacity
                      style={styles.removeSkillButton}
                      onPress={() => {
                        const newSkills = selectedSkills.filter((_, i) => i !== index);
                        console.log('🗑️ Removing skill at index:', index, 'Skill:', skill);
                        updateSkills(newSkills);
                      }}
                    >
                      <Text style={styles.removeSkillText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {showSkillsDropdown && (
              <View style={styles.dropdown}>
                <ScrollView 
                  style={styles.dropdownScrollView}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                >
                  {availableSkills.map((skill) => (
                    <TouchableOpacity
                      key={skill}
                      style={[
                        styles.dropdownItem,
                        selectedSkills.includes(skill) && styles.dropdownItemSelected
                      ]}
                      onPress={() => {
                        const newSelected = [...selectedSkills];
                        const index = newSelected.indexOf(skill);
                        if (index > -1) {
                          newSelected.splice(index, 1);
                          console.log('➖ Removing skill:', skill);
                        } else {
                          newSelected.push(skill);
                          console.log('➕ Adding skill:', skill);
                        }
                        updateSkills(newSelected);
                        setShowSkillsDropdown(false);
                      }}
                    >
                      <Text style={[
                        styles.dropdownText,
                        selectedSkills.includes(skill) && styles.dropdownTextSelected
                      ]}>
                        {getSkillTranslation(skill)}
                      </Text>
                      {selectedSkills.includes(skill) && (
                        <View style={styles.selectedIndicator}>
                          <Ionicons name="checkmark" size={16} color="#215433" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* About/Description field with proper keyboard handling */}
          <View 
            style={{ marginBottom: 20 }}
            onLayout={(e) => {
              // Store the Y position of the description field
              setDescriptionY(e.nativeEvent.layout.y);
            }}
          >
            <TextInput 
              style={[styles.input, styles.textarea]} 
              value={about} 
              onChangeText={setAbout} 
              placeholder={t("taskerEditProfile.about") || "About"} 
              textAlign={I18nManager.isRTL ? "right" : "left"} 
              textAlignVertical="top" 
              placeholderTextColor="#999" 
              multiline 
              maxLength={150}
              returnKeyType="done"
              blurOnSubmit={true}
              onFocus={() => {
                // The keyboard listener will handle scrolling automatically
              }}
            />
            <Text style={styles.characterCount}>
              {about.length}/150 characters
            </Text>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleSave}>
            <Text style={styles.buttonText}>{t("taskerEditProfile.save")}</Text>
          </TouchableOpacity>

          {/* Spacer for keyboard */}
          <View style={{ height: 50 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    paddingTop: 20,
    paddingBottom: 100, // Reduced to ensure save button is visible
    paddingHorizontal: 24,
    flexGrow: 1, // Changed from flex: 1 to flexGrow: 1 for proper scrolling
  },

  headerContainer: {
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 30,
    gap: 8,
  },

  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: I18nManager.isRTL ? "flex-end" : "flex-start",
  },

  header: {
    fontFamily: "InterBold",
    fontSize: 22,
    color: "#215433",
    textAlign: "center",
  },

  input: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    fontFamily: "Inter",
    color: "#333",
    borderWidth: 1,
    borderColor: "#e9ecef",
    marginBottom: 20,
  },

  textarea: {
    height: 120,
    textAlignVertical: "top",
  },

  button: {
    backgroundColor: "#215433",
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  buttonText: {
    fontFamily: "InterBold",
    fontSize: 18,
    color: "#ffffff",
  },

  phoneContainer: {
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    width: "100%",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    marginBottom: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  
  countryPickerWrapper: {
    justifyContent: "center",
    paddingHorizontal: 10,
    backgroundColor: "#e0e0e0",
    ...(I18nManager.isRTL ? { borderLeftWidth: 1, borderLeftColor: "#ccc" } : { borderRightWidth: 1, borderRightColor: "#ccc" }),
  },
  
  phoneInput: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    fontFamily: "Inter",
    color: "#333",
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  
  dropdown: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    maxHeight: 200,
  },

  dropdownItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f3f4",
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  dropdownText: {
    fontSize: 16,
    fontFamily: "Inter",
    color: "#333",
    flex: 1,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },

  dropdownItemSelected: {
    backgroundColor: "#f0f9eb", // Light green background for selected items
    borderColor: "#a5d6a7", // Green border for selected items
    borderWidth: 1,
  },

  dropdownTextSelected: {
    color: "#215433", // Dark green for selected text
    fontWeight: "bold",
  },

  selectedSkillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
    gap: 8,
  },

  selectedSkillItem: {
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    alignItems: "center",
    backgroundColor: "#215433",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    gap: 6,
  },

  selectedSkillText: {
    color: "#ffffff",
    fontFamily: "InterMedium",
    fontSize: 14,
  },

  removeSkillButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  removeSkillText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    lineHeight: 18,
  },

  dropdownScrollView: {
    maxHeight: 200,
  },

  selectedIndicator: {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: [{ translateY: -8 }],
  },

  characterCount: {
    fontSize: 14,
    color: "#999",
    textAlign: "right",
    marginTop: 8,
    paddingRight: 16,
  },

  closeDropdownButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },

  closeDropdownText: {
    fontSize: 16,
    fontFamily: "Inter",
    color: "#215433",
    fontWeight: "bold",
  },
});

  
