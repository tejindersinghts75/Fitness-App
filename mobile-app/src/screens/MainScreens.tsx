import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Image,
  ImageBackground,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AppButton,
  AppHeader,
  EmptyState,
  GlassCard,
  LoadingState,
  PlanCard,
  SectionHeader,
  StatusBadge,
} from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useCatalog } from "../context/CatalogContext";
import { useAppTheme } from "../context/ThemeContext";
import { VideoProgressRecord, videoProgressService } from "../services/videoProgressService";
import { RootStackParamList } from "../types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
const trainerImage = require("../../assets/fitness-hero.png");
const fitnessDuoImage = require("../../assets/fitness-duo-banner-16x9.png");
const bodyStrengthImage = require("../../assets/body-strength-workout.png");
const kettlebellStrengthImage = require("../../assets/kettlebell-strength-workout.png");
const systemFont = Platform.select({ ios: "System", android: "sans-serif" });
const serviceCategories = [
  { name: "Muscle Building", icon: "barbell" },
  { name: "Strength", icon: "fitness" },
  { name: "Fat Loss", icon: "flame" },
  { name: "Mobility", icon: "accessibility" },
  { name: "Cardio", icon: "heart" },
] as const;
const featuredWorkouts = [
  { title: "Body Strength\nWorkout", image: bodyStrengthImage },
  { title: "Kettlebell Strength\nWorkout", image: kettlebellStrengthImage },
] as const;
const categoryVideoTitles: Record<string, string[]> = {
  "Muscle Building": ["Upper Body Builder", "Chest & Triceps", "Back & Biceps", "Leg Mass Session", "Full Body Hypertrophy"],
  Strength: ["Foundational Strength", "Power Lifting Basics", "Lower Body Power", "Strong Core Circuit", "Total Body Strength"],
  "Fat Loss": ["Full Body Burn", "Low Impact Fat Burn", "Metabolic Conditioning", "HIIT Sweat Session", "Cardio Strength Burn"],
  Mobility: ["Morning Mobility", "Hip Opening Flow", "Shoulder Mobility", "Full Body Recovery", "Evening Flexibility"],
  Cardio: ["Beginner Cardio", "Endurance Builder", "Low Impact Cardio", "Cardio Intervals", "Full Body Cardio"],
};
const categoryDurations = ["18 min", "24 min", "30 min", "36 min", "45 min"];
const Shell = ({
  children,
  onRefresh,
  refreshing = false,
  contentGap = 18,
}: React.PropsWithChildren<{
  onRefresh?: () => Promise<void>;
  refreshing?: boolean;
  contentGap?: number;
}>) => {
  const { theme } = useAppTheme();
  const { loading, refresh } = useCatalog();
  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: theme.background }}
    >
      <ScrollView
        contentContainerStyle={[s.page, { gap: contentGap }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading || refreshing}
            onRefresh={() =>
              Promise.all([refresh(), onRefresh?.()]).catch(() => undefined)
            }
            tintColor={theme.accent}
            colors={[theme.accent]}
          />
        }
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
};

export const HomeScreen = () => {
  const { theme } = useAppTheme();
  const { profile, user } = useAuth();
  const nav = useNavigation<Nav>();
  const { width } = useWindowDimensions();
  const { videos, coaches } = useCatalog();
  const featured = videos[0];
  const workoutCardWidth = width - 40;
  const workoutSlideGap = 12;
  const workoutSnapInterval = workoutCardWidth + workoutSlideGap;
  const workoutSliderRef = useRef<ScrollView>(null);
  const openTrainers = useCallback(() => {
    const stackNavigation = nav.getParent<Nav>();
    (stackNavigation || nav).navigate("Trainers");
  }, [nav]);
  const [activeWorkoutSlide, setActiveWorkoutSlide] = useState(0);
  const [selectedScheduleDay, setSelectedScheduleDay] = useState(0);
  const scheduleDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() + index);
        const workoutIndex = index % 2 === 0 ? (index / 2) % 2 : null;
        return {
          date,
          day: date.toLocaleDateString("en-US", { weekday: "short" }),
          dateNumber: date.getDate(),
          workoutIndex,
        };
      }),
    [],
  );
  const selectedSchedule = scheduleDays[selectedScheduleDay];
  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "there";
  const firstName = displayName.trim().split(/\s+/)[0];
  return (
    <Shell contentGap={20}>
      <View style={s.welcome}>
        <View style={s.welcomeUser}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open profile"
            onPress={() => (nav as any).navigate("Profile")}
            hitSlop={12}
            pressRetentionOffset={16}
            style={({ pressed }) => [
              s.profileTapTarget,
              { opacity: pressed ? 0.65 : 1 },
            ]}
          >
            <Image source={trainerImage} style={s.userPhoto} />
          </Pressable>
          <View>
            <Text style={{ color: theme.muted, fontSize: 13 }}>
              Welcome back
            </Text>
            <Text style={[s.welcomeName, { color: theme.text }]}>
              {firstName}
            </Text>
          </View>
        </View>
        <Pressable
          style={[s.iconButton, { backgroundColor: theme.surfaceAlt }]}
        >
          <Ionicons name="notifications-outline" size={21} color={theme.text} />
          <View
            style={[s.notificationDot, { backgroundColor: theme.accent }]}
          />
        </Pressable>
      </View>

      <View
        style={[
          s.goalBanner,
          {
            backgroundColor: theme.accent,
            borderColor: theme.accent,
          },
        ]}
      >
        <LinearGradient
          colors={["#FF7A2F", "#C83B05"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Image source={fitnessDuoImage} style={s.goalBannerImage} resizeMode="contain" />
        <LinearGradient
          pointerEvents="none"
          colors={["rgba(91,19,0,0)", "rgba(91,19,0,.22)"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={s.goalBannerInnerShade}
        />
        <LinearGradient
          pointerEvents="none"
          colors={["rgba(72,15,0,.16)", "rgba(72,15,0,0)"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={s.goalBannerInnerLeft}
        />
        <LinearGradient
          pointerEvents="none"
          colors={["rgba(72,15,0,0)", "rgba(72,15,0,.16)"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={s.goalBannerInnerRight}
        />
        <LinearGradient
          pointerEvents="none"
          colors={["rgba(72,15,0,.11)", "rgba(72,15,0,0)"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={s.goalBannerInnerTop}
        />
        <View style={s.goalBannerCopy}>
          <Text style={[s.goalBannerEyebrow, { color: "#FFFFFF" }]}>YOUR NEXT LEVEL</Text>
          <Text style={[s.goalBannerTitle, { color: "#FFFFFF" }]}>STRONGER{"\n"}UNSTOPPABLE</Text>
        </View>
        <Pressable
          onPress={() => nav.navigate("Plans")}
          style={({ pressed }) => [
            s.goalBannerButton,
            {
              opacity: pressed ? 0.94 : 1,
              transform: [{ translateY: pressed ? 2 : 0 }],
            },
          ]}
        >
          <LinearGradient
            colors={[
              "rgba(255,255,255,.88)",
              "rgba(255,255,255,.62)",
              "rgba(225,225,221,.48)",
            ]}
            locations={[0, 0.56, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={s.goalBannerButtonFace}
          >
            <BlurView intensity={42} tint="light" style={StyleSheet.absoluteFill} />
            <View style={s.goalBannerButtonGloss} />
            <Text style={s.goalBannerButtonText}>Explore plans</Text>
          </LinearGradient>
        </Pressable>
      </View>

      <View>
        <SectionHeader title="Category" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.fullBleedScroller}
          contentContainerStyle={s.categoryRow}
        >
          {serviceCategories.map((category) => (
            <Pressable
              key={category.name}
              onPress={() => nav.navigate("CategoryVideos", { category: category.name })}
              style={({ pressed }) => [
                s.categoryItem,
                { opacity: pressed ? 0.72 : 1 },
              ]}
            >
              <View
                style={[
                  s.categoryPhoto,
                  {
                    backgroundColor: theme.accentSoft,
                    borderColor: `${theme.accent}30`,
                  },
                ]}
              >
                <Ionicons name={category.icon} size={33} color={theme.accent} />
              </View>
              <Text
                numberOfLines={2}
                style={[s.categoryLabel, { color: theme.text }]}
              >
                {category.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View>
        <SectionHeader title="Your Schedule" />
        <View style={s.scheduleCalendarRow}>
          {scheduleDays.map((item, index) => {
            const selected = index === selectedScheduleDay;
            const scheduled = item.workoutIndex !== null;
            return (
              <Pressable
                key={item.date.toISOString()}
                onPress={() => {
                  setSelectedScheduleDay(index);
                  if (item.workoutIndex !== null) {
                    setActiveWorkoutSlide(item.workoutIndex);
                    workoutSliderRef.current?.scrollTo({
                      x: item.workoutIndex * workoutSnapInterval,
                      animated: true,
                    });
                  }
                }}
                style={({ pressed }) => [
                  s.scheduleCalendarDay,
                  {
                    backgroundColor: selected
                      ? theme.accent
                      : scheduled
                        ? "#FFF0E7"
                        : "#FFF8F4",
                    borderColor: selected ? theme.accent : "#FFE1D0",
                    opacity: pressed ? 0.7 : 1,
                  },
                  selected && s.scheduleCalendarDaySelected,
                ]}
              >
                <Text
                  style={[
                    s.scheduleCalendarDayName,
                    { color: selected ? "#FFFFFF" : theme.muted },
                  ]}
                >
                  {item.day}
                </Text>
                <View
                  style={[
                    s.scheduleCalendarDateBubble,
                    {
                      backgroundColor: selected ? "#FFFFFF" : "rgba(255,255,255,0.9)",
                      borderColor: selected ? "rgba(255,255,255,0.7)" : "#FFE6D8",
                    },
                  ]}
                >
                  <Text
                    style={[
                      s.scheduleCalendarDate,
                      { color: selected ? theme.accent : theme.text },
                    ]}
                  >
                    {item.dateNumber}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
        <View
          style={[
            s.scheduleSelection,
            { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
          ]}
        >
          <Ionicons
            name={selectedSchedule.workoutIndex !== null ? "barbell-outline" : "moon-outline"}
            size={18}
            color={theme.accent}
          />
          <View style={{ flex: 1 }}>
            <Text style={[s.scheduleSelectionTitle, { color: theme.text }]}>
              {selectedSchedule.workoutIndex !== null
                ? featuredWorkouts[selectedSchedule.workoutIndex].title.replace("\n", " ")
                : "Recovery day"}
            </Text>
            <Text style={[s.scheduleSelectionMeta, { color: theme.muted }]}>
              {selectedSchedule.workoutIndex !== null
                ? "45 mins · Tap the workout below to begin"
                : "No workout scheduled"}
            </Text>
          </View>
        </View>
      </View>

      <View>
        <SectionHeader title="Today Exercise" />
        <ScrollView
          ref={workoutSliderRef}
          style={[s.workoutSlider, s.fullBleedScroller]}
          contentContainerStyle={s.workoutSliderContent}
          horizontal
          snapToInterval={workoutSnapInterval}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) =>
            setActiveWorkoutSlide(
              Math.round(event.nativeEvent.contentOffset.x / workoutSnapInterval),
            )
          }
        >
          {featuredWorkouts.map((workout) => (
            <ImageBackground
              key={workout.title}
              source={workout.image}
              resizeMode="cover"
              imageStyle={s.strengthFeatureImage}
              style={[s.strengthFeature, { width: workoutCardWidth }]}
            >
              <LinearGradient
                colors={["rgba(4,9,14,.82)", "rgba(4,9,14,.28)", "rgba(4,9,14,.08)"]}
                locations={[0, 0.58, 1]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={s.strengthFeatureCopy}>
                <Text style={s.strengthFeatureTitle}>{workout.title}</Text>
                <View style={s.strengthFeatureActions}>
                  <View style={s.strengthFeatureTime}>
                    <Ionicons name="time-outline" size={14} color="#FFFFFF" />
                    <Text style={s.strengthFeatureTimeText}>45 mins</Text>
                  </View>
                  <Pressable
                    onPress={() =>
                      featured
                        ? nav.navigate("VideoDetails", { videoId: featured.id })
                        : nav.navigate("MySubscription")
                    }
                    style={({ pressed }) => [
                      s.strengthFeaturePlay,
                      { backgroundColor: theme.accent, opacity: pressed ? 0.72 : 1 },
                    ]}
                  >
                    <Ionicons name="play" size={17} color="#FFFFFF" />
                  </Pressable>
                </View>
              </View>
            </ImageBackground>
          ))}
        </ScrollView>
        <View style={s.workoutPagination}>
          {featuredWorkouts.map((workout, index) => (
            <View
              key={workout.title}
              style={[
                s.workoutPaginationDot,
                {
                  backgroundColor:
                    index === activeWorkoutSlide ? theme.accent : theme.border,
                  width: index === activeWorkoutSlide ? 18 : 6,
                },
              ]}
            />
          ))}
        </View>
      </View>

      {coaches.length > 0 && <>
      <SectionHeader title="Your trainers" action="See all" onPress={openTrainers} />
      <ScrollView
        horizontal
        pagingEnabled
        snapToInterval={width - 28}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.trainerCarousel}
      >
        {coaches.map((coach) => (
          <Pressable
            key={coach.id}
            onPress={() => nav.navigate("CoachProfile", { coachId: coach.id })}
            style={({ pressed }) => [
              s.trainerTile,
              {
                width: width - 40,
                backgroundColor: theme.dark ? "#20201F" : "#F8F8F6",
                borderColor: theme.dark ? "#333331" : "#ECECE8",
                opacity: pressed ? 0.82 : 1,
              },
            ]}
          >
            <View style={s.trainerTileCopy}>
              <Text style={[s.trainerSpecialty, { color: theme.muted }]}>
                {coach.specialty}
              </Text>
              <Text style={[s.trainerName, { color: theme.text }]}>
                Coach {coach.name}
              </Text>
              <Text style={[s.trainerDescription, { color: theme.muted }]}>
                Personal guidance for your next level.
              </Text>
              <View style={s.trainerTileAction}>
                <Text
                  style={{
                    color: theme.accent,
                    fontSize: 11,
                    fontWeight: "800",
                  }}
                >
                  View profile
                </Text>
                <Ionicons name="arrow-forward" size={13} color={theme.accent} />
              </View>
            </View>
            <View pointerEvents="none" style={s.coachImageLayer}>
              <Image
                source={{ uri: coach.photoUrl }}
                resizeMode="contain"
                style={s.trainerCutout}
              />
            </View>
          </Pressable>
        ))}
      </ScrollView>
      </>}

      {featured && (
        <>
          <SectionHeader title="Continue training" action="See all" />
          <ImageBackground
            source={{ uri: featured.thumbnailUrl }}
            imageStyle={s.workoutImage}
            style={s.workoutHero}
          >
            <View style={s.workoutShade} />
            <View style={s.levelPill}>
              <Ionicons name="flash" size={12} color="#fff" />
              <Text style={s.levelText}>{featured.category}</Text>
            </View>
            <View style={s.workoutCopy}>
              <Text style={s.workoutTitle}>{featured.title}</Text>
              <Text style={s.workoutSubtitle}>{featured.description}</Text>
              <View style={s.workoutActions}>
                <View style={s.timePill}>
                  <Ionicons name="time-outline" size={15} color={theme.text} />
                  <Text
                    style={{
                      color: theme.text,
                      fontWeight: "800",
                      fontSize: 12,
                    }}
                  >
                    {featured.duration}
                  </Text>
                </View>
                <Pressable
                  onPress={() =>
                    nav.navigate("VideoDetails", { videoId: featured.id })
                  }
                  style={[s.playButton, { backgroundColor: theme.accent }]}
                >
                  <Ionicons name="play" size={17} color="#fff" />
                </Pressable>
              </View>
            </View>
          </ImageBackground>
        </>
      )}

      <SectionHeader title="Scheduled" action="All schedules" />
      <View style={s.scheduleList}>
        {[
          ["TODAY", "7:00", "Bench Press", "Strength · 4 sets"],
          ["TOM", "6:30", "Core Control", "Core · 25 min"],
          ["FRI", "8:00", "Mobility Flow", "Recovery · 30 min"],
        ].map(([day, time, title, detail]) => (
          <View
            key={title}
            style={[
              s.scheduleCard,
              {
                backgroundColor: theme.dark ? "#191918" : "#FAFAF8",
                borderColor: theme.dark ? "#30302E" : "#ECEBE7",
              },
            ]}
          >
            <View
              style={[
                s.dateBlock,
                { backgroundColor: theme.dark ? "#302019" : theme.accentSoft },
              ]}
            >
              <Text style={[s.dateDay, { color: theme.accent }]}>{day}</Text>
              <Text style={[s.dateTime, { color: theme.text }]}>{time}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.rowTitle, { color: theme.text }]}>{title}</Text>
              <Text style={{ color: theme.muted, fontSize: 12, marginTop: 3 }}>
                {detail}
              </Text>
            </View>
            <Pressable
              style={[s.schedulePlay, { backgroundColor: theme.accent }]}
            >
              <Ionicons name="play" size={14} color="#fff" />
            </Pressable>
          </View>
        ))}
      </View>
    </Shell>
  );
};

type CategoryVideosProps = NativeStackScreenProps<RootStackParamList, "CategoryVideos">;

export const CategoryVideosScreen = ({ navigation, route }: CategoryVideosProps) => {
  const { theme } = useAppTheme();
  const titles = categoryVideoTitles[route.params.category] ?? categoryVideoTitles.Strength;

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.categoryVideosPage}
      >
        <AppHeader
          title={route.params.category}
          subtitle="Choose a workout and start moving."
          back
          onBack={() => navigation.goBack()}
        />
        <View style={s.categoryVideosIntro}>
          <Text style={[s.categoryVideosCount, { color: theme.accent }]}>5 VIDEOS</Text>
          <Text style={[s.categoryVideosDescription, { color: theme.muted }]}>Fresh sessions for every level. Your uploaded videos will appear here automatically later.</Text>
        </View>
        <View style={s.categoryVideosList}>
          {titles.map((title, index) => (
            <View
              key={`${route.params.category}-${title}`}
              style={[s.categoryVideoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <ImageBackground
                source={index % 2 === 0 ? bodyStrengthImage : kettlebellStrengthImage}
                resizeMode="cover"
                imageStyle={s.categoryVideoImage}
                style={s.categoryVideoImageWrap}
              >
                <LinearGradient
                  colors={["rgba(0,0,0,.04)", "rgba(0,0,0,.72)"]}
                  style={StyleSheet.absoluteFill}
                />
                <View style={s.categoryVideoTopRow}>
                  <View style={s.categoryVideoNumber}><Text style={s.categoryVideoNumberText}>{String(index + 1).padStart(2, "0")}</Text></View>
                  <View style={s.categoryVideoDuration}><Ionicons name="time-outline" size={13} color="#FFFFFF"/><Text style={s.categoryVideoDurationText}>{categoryDurations[index]}</Text></View>
                </View>
                <View style={s.categoryVideoBottomRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.categoryVideoTitle}>{title}</Text>
                    <Text style={s.categoryVideoMeta}>{route.params.category} · All levels</Text>
                  </View>
                  <View style={[s.categoryVideoPlay, { backgroundColor: theme.accent }]}>
                    <Ionicons name="play" size={20} color="#FFFFFF" style={{ marginLeft: 2 }}/>
                  </View>
                </View>
              </ImageBackground>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

type CoachProfileProps = NativeStackScreenProps<RootStackParamList, "CoachProfile">;

type TrainersProps = NativeStackScreenProps<RootStackParamList, "Trainers">;

export const TrainersScreen = ({ navigation }: TrainersProps) => {
  const { theme } = useAppTheme();
  const { coaches, loading, refresh } = useCatalog();

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.trainersPage}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => refresh().catch(() => undefined)} tintColor={theme.accent} colors={[theme.accent]} />}
      >
        <AppHeader title="Our trainers" subtitle="Meet the experts guiding your progress." back onBack={() => navigation.goBack()} />
        {loading && !coaches.length ? <LoadingState /> : coaches.length ? (
          <View style={s.trainersList}>
            {coaches.map((coach) => (
              <Pressable
                key={coach.id}
                onPress={() => navigation.navigate("CoachProfile", { coachId: coach.id })}
                style={({ pressed }) => [s.trainersCard, { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? .78 : 1 }]}
              >
                <View style={[s.trainersPhotoWrap, { backgroundColor: theme.dark ? "#292927" : "#F2F2EF" }]}>
                  <Image source={{ uri: coach.photoUrl }} resizeMode="contain" style={s.trainersPhoto} />
                </View>
                <View style={s.trainersCardCopy}>
                  <Text style={[s.trainersSpecialty, { color: theme.accent }]}>{coach.specialty.toUpperCase()}</Text>
                  <Text style={[s.trainersName, { color: theme.text }]}>Coach {coach.name}</Text>
                  <Text numberOfLines={2} style={[s.trainersBio, { color: theme.muted }]}>{coach.bio}</Text>
                  <View style={s.trainersMetaRow}>
                    <Text style={[s.trainersMeta, { color: theme.text }]}>{coach.experienceYears} yrs</Text>
                    <Text style={[s.trainersMeta, { color: theme.text }]}>★ {coach.rating.toFixed(1)}</Text>
                  </View>
                  <View style={s.trainersProfileLink}>
                    <Text style={{ color: theme.accent, fontWeight: "800", fontSize: 12 }}>View profile</Text>
                    <Ionicons name="chevron-forward" size={15} color={theme.accent} />
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        ) : <EmptyState title="No trainers are published yet." />}
      </ScrollView>
    </SafeAreaView>
  );
};

export const CoachProfileScreen = ({ navigation, route }: CoachProfileProps) => {
  const { theme } = useAppTheme();
  const { coaches, loading } = useCatalog();
  const coach = coaches.find((item) => item.id === route.params.coachId);

  if (loading && !coach) return <LoadingState />;
  if (!coach) {
    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: theme.background }}>
        <View style={s.coachProfilePage}>
          <AppHeader title="Coach profile" back onBack={() => navigation.goBack()} />
          <EmptyState title="This coach profile is no longer published." />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.coachProfilePage}>
        <AppHeader title="Coach profile" back onBack={() => navigation.goBack()} />
        <View style={[s.coachProfileHero, { backgroundColor: theme.dark ? "#242321" : "#F2F2EF", borderColor: theme.border }]}>
          <LinearGradient
            colors={theme.dark ? ["#302F2C", "#1C1C1B"] : ["#FAFAF8", "#E8E8E3"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={[s.coachProfileAccent, { backgroundColor: theme.accentSoft }]} />
          <Image source={{ uri: coach.photoUrl }} resizeMode="contain" style={s.coachProfilePhoto} />
          <LinearGradient colors={["transparent", "rgba(0,0,0,.72)"]} style={s.coachProfileHeroShade} />
          <View style={s.coachProfileIdentity}>
            <Text style={s.coachProfileSpecialty}>{coach.specialty.toUpperCase()} COACH</Text>
            <Text style={s.coachProfileName}>Coach {coach.name}</Text>
          </View>
        </View>

        <View style={s.coachStatsRow}>
          {[[`${coach.experienceYears} years`, "Experience"], [coach.rating.toFixed(1), "Rating"], [`${coach.clientsCount}+`, "Clients"]].map(([value, label]) => (
            <View key={label} style={[s.coachStat, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[s.coachStatValue, { color: theme.text }]}>{value}</Text>
              <Text style={[s.coachStatLabel, { color: theme.muted }]}>{label}</Text>
            </View>
          ))}
        </View>

        <View style={s.coachProfileSection}>
          <Text style={[s.coachProfileHeading, { color: theme.text }]}>About {coach.name}</Text>
          <Text style={[s.coachProfileBio, { color: theme.muted }]}>{coach.bio}</Text>
        </View>

        <View style={s.coachProfileSection}>
          <Text style={[s.coachProfileHeading, { color: theme.text }]}>Expertise</Text>
          <View style={s.coachExpertiseWrap}>
            {coach.expertise.map((item) => (
              <View key={item} style={[s.coachExpertiseChip, { backgroundColor: theme.accentSoft, borderColor: `${theme.accent}30` }]}>
                <Ionicons name="checkmark-circle" size={16} color={theme.accent} />
                <Text style={[s.coachExpertiseText, { color: theme.text }]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[s.coachApproachCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[s.coachApproachIcon, { backgroundColor: theme.accentSoft }]}>
            <Ionicons name="sparkles" size={21} color={theme.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.coachApproachTitle, { color: theme.text }]}>Coaching approach</Text>
            <Text style={[s.coachApproachCopy, { color: theme.muted }]}>Supportive, goal-focused sessions with clear guidance and progress you can measure.</Text>
          </View>
        </View>

        <AppButton title="Explore training plans" onPress={() => navigation.navigate("Plans")} />
      </ScrollView>
    </SafeAreaView>
  );
};

export const ExploreScreen = () => {
  const { theme } = useAppTheme();
  const nav = useNavigation<Nav>();
  const { plans, videos, subscriptions, loading, error } = useCatalog();
  const [active, setActive] = useState("All");
  const [query, setQuery] = useState("");
  const categories = [
    "All",
    ...plans
      .filter((plan) => videos.some((video) => video.packageId === plan.id))
      .map((plan) => plan.name),
  ];
  const shown = useMemo(
    () =>
      videos.filter(
        (v) =>
          (active === "All" || v.category === active) &&
          v.title.toLowerCase().includes(query.toLowerCase()),
      ),
    [active, query, videos],
  );
  const hasActiveSubscription = subscriptions.some(
    item => item.status === "active" && new Date(item.expiresAt).getTime() > Date.now(),
  );
  return (
    <Shell>
      <AppHeader title="Workouts" subtitle="Find your next workout." />
      {hasActiveSubscription && <>
      <View
        style={[
          s.search,
          { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
        ]}
      >
        <Ionicons name="search" size={20} color={theme.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search workouts"
          placeholderTextColor={theme.muted}
          style={{ flex: 1, color: theme.text, fontSize: 16 }}
        />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {categories.map((c) => (
          <Pressable
            key={c}
            onPress={() => setActive(c)}
            style={[
              s.chip,
              {
                backgroundColor: active === c ? theme.accent : theme.surfaceAlt,
              },
            ]}
          >
            <Text
              style={{
                color: active === c ? "#fff" : theme.text,
                fontWeight: "700",
              }}
            >
              {c}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <SectionHeader title={`${active} workouts`} />
      </>}
      {loading ? (
        <LoadingState />
      ) : error ? (
        <EmptyState title={error} />
      ) : !hasActiveSubscription ? (
        <SubscriptionPrompt onPress={() => nav.navigate("Plans")} />
      ) : shown.length === 0 ? (
        <EmptyState title="No workouts in your active subscriptions" />
      ) : (
        <View style={s.workoutList}>
          {shown.map((v) => (
            <Pressable
              key={v.id}
              onPress={() => nav.navigate("VideoDetails", { videoId: v.id })}
              style={({ pressed }) => [
                s.exploreCard,
                { opacity: pressed ? 0.82 : 1 },
              ]}
            >
              <ImageBackground
                source={{ uri: v.thumbnailUrl }}
                resizeMode="cover"
                imageStyle={s.exploreImage}
                style={s.exploreImage}
              >
                <View style={s.exploreShade} />
                <View style={s.exploreContent}>
                  <View style={s.exploreTop}>
                    <View style={s.darkPill}>
                      <Text style={s.darkPillText}>{v.category}</Text>
                    </View>
                  </View>
                  <View>
                    <Text style={s.exploreTitle}>{v.title}</Text>
                    <Text style={s.exploreTrainer}>with {v.trainer}</Text>
                    <View style={s.exploreActions}>
                      <View style={s.whiteTimePill}>
                        <Ionicons
                          name="time-outline"
                          size={15}
                          color={theme.text}
                        />
                        <Text
                          style={{
                            color: theme.text,
                            fontSize: 12,
                            fontWeight: "800",
                          }}
                        >
                          {v.duration}
                        </Text>
                      </View>
                      <View
                        style={[
                          s.explorePlay,
                          { backgroundColor: theme.accent },
                        ]}
                      >
                        <Ionicons name="play" size={16} color="#fff" />
                      </View>
                    </View>
                  </View>
                </View>
              </ImageBackground>
            </Pressable>
          ))}
        </View>
      )}
    </Shell>
  );
};

const formatProgressTime = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
};

const SubscriptionPrompt = ({ onPress }: { onPress: () => void }) => {
  const { theme } = useAppTheme();
  return <View style={[s.progressEmptyCard, { backgroundColor: "#FFF7F2", borderColor: "#FFD9C4" }]}>
    <View style={s.progressEmptyDecorationOne} />
    <View style={s.progressEmptyDecorationTwo} />
    <View style={[s.progressEmptyIconHalo, { backgroundColor: "#FFE6D7" }]}>
      <View style={[s.progressEmptyIcon, { backgroundColor: theme.accent }]}>
        <Ionicons name="barbell" size={31} color="#FFFFFF" />
      </View>
    </View>
    <Text style={[s.progressEmptyTitle, { color: theme.text }]}>Start your fitness journey</Text>
    <Text style={[s.progressEmptyCopy, { color: theme.muted }]}>Choose a plan to unlock guided workouts. Your completed sessions and video progress will appear here automatically.</Text>
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.progressEmptyCta, { backgroundColor: theme.accent, opacity: pressed ? .8 : 1 }]}
    >
      <Text style={s.progressEmptyCtaText}>Explore plans</Text>
      <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
    </Pressable>
    <View style={s.progressEmptyTrustRow}>
      <Ionicons name="checkmark-circle" size={15} color={theme.accent} />
      <Text style={[s.progressEmptyTrustText, { color: theme.muted }]}>Pick the program that matches your goal</Text>
    </View>
  </View>;
};

export const ProgressScreen = () => {
  const { theme } = useAppTheme();
  const nav = useNavigation<Nav>();
  const { videos, subscriptions, loading, error } = useCatalog();
  const [progress, setProgress] = useState<Record<string, VideoProgressRecord>>({});

  useFocusEffect(
    useCallback(() => {
      let active = true;
      videoProgressService.getAll().then(records => {
        if (active) setProgress(records);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const inProgress = useMemo(
    () => videos
      .map(video => ({ video, record: progress[video.id] }))
      .filter(({ record }) => {
        if (!record || record.positionSeconds <= 0) return false;
        const duration = record.durationSeconds || 1;
        return record.positionSeconds / duration < 0.98;
      })
      .sort((a, b) => b.record.updatedAt.localeCompare(a.record.updatedAt)),
    [progress, videos],
  );
  const hasActiveSubscription = subscriptions.some(
    item => item.status === "active" && new Date(item.expiresAt).getTime() > Date.now(),
  );

  return <Shell>
    <AppHeader title="Progress" subtitle="Continue where you left off." />
    <SectionHeader title="Videos in progress" />
    {loading ? <LoadingState /> : error ? <EmptyState title={error} /> : !hasActiveSubscription ? (
      <SubscriptionPrompt onPress={() => nav.navigate("Plans")} />
    ) : inProgress.length === 0 ? (
      <View style={[s.progressEmptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[s.progressEmptyIconHalo, { backgroundColor: theme.accentSoft }]}>
          <View style={[s.progressEmptyIcon, { backgroundColor: theme.accent }]}>
            <Ionicons name="play" size={30} color="#FFFFFF" />
          </View>
        </View>
        <Text style={[s.progressEmptyTitle, { color: theme.text }]}>Start your first workout</Text>
        <Text style={[s.progressEmptyCopy, { color: theme.muted }]}>Once you begin a video, you can continue exactly where you left off from this page.</Text>
        <Pressable
          onPress={() => (nav as any).navigate("Subscription")}
          style={({ pressed }) => [s.progressEmptyCta, { backgroundColor: theme.accent, opacity: pressed ? .8 : 1 }]}
        >
          <Text style={s.progressEmptyCtaText}>Browse workouts</Text>
          <Ionicons name="play-circle-outline" size={19} color="#FFFFFF" />
        </Pressable>
      </View>
    ) : (
      <View style={s.progressVideoList}>
        {inProgress.map(({ video, record }) => {
          const duration = Math.max(record.durationSeconds || video.durationSeconds, 1);
          const position = Math.min(record.positionSeconds, duration);
          const ratio = Math.min(position / duration, 1);
          const percentage = Math.round(ratio * 100);
          return <Pressable
            key={video.id}
            onPress={() => nav.navigate("VideoDetails", { videoId: video.id })}
            style={({ pressed }) => [
              s.progressVideoCard,
              { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? .8 : 1 },
            ]}
          >
            <Image source={{ uri: video.thumbnailUrl }} style={s.progressVideoImage} />
            <View style={s.progressVideoBody}>
              <View style={s.progressVideoHeading}>
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={[s.progressVideoTitle, { color: theme.text }]}>{video.title}</Text>
                  <Text style={[s.progressVideoMeta, { color: theme.muted }]}>{video.category} · {percentage}% watched</Text>
                </View>
                <View style={[s.progressResumeButton, { backgroundColor: theme.accent }]}>
                  <Ionicons name="play" size={14} color="#FFFFFF" />
                </View>
              </View>
              <View style={[s.progressTrack, { backgroundColor: theme.border }]}>
                <View style={[s.progressFill, { width: `${percentage}%`, backgroundColor: theme.accent }]} />
              </View>
              <View style={s.progressTimes}>
                <Text style={[s.progressTime, { color: theme.muted }]}>{formatProgressTime(position)}</Text>
                <Text style={[s.progressTime, { color: theme.muted }]}>{formatProgressTime(duration)}</Text>
              </View>
            </View>
          </Pressable>;
        })}
      </View>
    )}
  </Shell>;
};
export const PlansScreen = () => {
  const nav = useNavigation<Nav>();
  const { plans, loading, error } = useCatalog();
  return (
    <Shell>
      <AppHeader
        title="Membership"
        subtitle="Choose the program that matches your goal."
        back
        onBack={() => nav.goBack()}
      />
      {loading ? (
        <LoadingState />
      ) : error ? (
        <EmptyState title={error} />
      ) : (
        plans.map((p) => (
          <PlanCard
            key={p.id}
            plan={p}
            onDetails={() => nav.navigate("PlanDetails", { planId: p.id })}
            onChoose={() => nav.navigate("Checkout", { planId: p.id })}
          />
        ))
      )}
    </Shell>
  );
};
export const SubscriptionScreen = () => {
  const { theme } = useAppTheme();
  const nav = useNavigation<Nav>();
  const { plans, subscriptions } = useCatalog();
  const active = subscriptions.filter(
    (item) =>
      item.status === "active" &&
      new Date(item.expiresAt).getTime() > Date.now(),
  );
  return (
    <Shell>
      <AppHeader
        title="My subscriptions"
        subtitle="Manage your programs and course access."
      />
      {active.length === 0 ? (
        <SubscriptionPrompt onPress={() => nav.navigate("Plans")} />
      ) : (
        <>
          {active.map((item) => {
            const plan = plans.find((p) => p.id === item.packageId);
            if (!plan) return null;
            const days = Math.max(
              0,
              Math.ceil(
                (new Date(item.expiresAt).getTime() - Date.now()) / 86400000,
              ),
            );
            return (
              <GlassCard key={item.id}>
                <View style={s.infoHead}>
                  <Text style={[s.subscriptionTitle, { color: theme.text }]}>{plan.name}</Text>
                  <StatusBadge label="Active" tone="success" />
                </View>
                {[
                  ["Expires", new Date(item.expiresAt).toLocaleDateString()],
                  ["Days remaining", `${days} days`],
                  ["Access", `${plan.name} videos`],
                ].map(([a, b]) => (
                  <View key={a} style={s.infoRow}>
                    <Text style={{ color: theme.muted }}>{a}</Text>
                    <Text style={{ color: theme.text, fontWeight: "800" }}>
                      {b}
                    </Text>
                  </View>
                ))}
              </GlassCard>
            );
          })}
          <AppButton title="Browse more packages" onPress={() => nav.navigate("Plans")} />
        </>
      )}
    </Shell>
  );
};

const s = StyleSheet.create({
  page: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 128, gap: 18 },
  welcome: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  welcomeUser: { flexDirection: "row", alignItems: "center", gap: 11 },
  profileTapTarget: {
    width: 56,
    height: 56,
    margin: -6,
    marginRight: -1,
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  userPhoto: { width: 44, height: 44, borderRadius: 16 },
  welcomeName: { fontSize: 23, fontWeight: "900", letterSpacing: -0.5 },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationDot: {
    position: "absolute",
    width: 7,
    height: 7,
    borderRadius: 4,
    right: 10,
    top: 10,
  },
  goalBanner: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderWidth: 1,
    borderRadius: 22,
    overflow: "hidden",
    position: "relative",
    justifyContent: "center",
    padding: 0,
  },
  goalBannerInnerShade: {
    position: "absolute",
    zIndex: 1,
    left: 2,
    right: 2,
    bottom: 2,
    height: "28%",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  goalBannerInnerLeft: {
    position: "absolute",
    zIndex: 1,
    left: 0,
    top: 0,
    bottom: 0,
    width: 18,
  },
  goalBannerInnerRight: {
    position: "absolute",
    zIndex: 1,
    right: 0,
    top: 0,
    bottom: 0,
    width: 18,
  },
  goalBannerInnerTop: {
    position: "absolute",
    zIndex: 1,
    left: 0,
    right: 0,
    top: 0,
    height: 16,
  },
  goalBannerCopy: {
    position: "absolute",
    top: 22,
    left: 17,
    width: "48%",
    alignItems: "flex-start",
    zIndex: 2,
  },
  goalBannerEyebrow: {
    fontFamily: systemFont,
    fontSize: 8,
    lineHeight: 10,
    fontWeight: "900",
    letterSpacing: 1.1,
    marginBottom: 6,
    opacity: 0.58,
  },
  goalBannerTitle: {
    fontFamily: systemFont,
    fontSize: 20,
    lineHeight: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  goalBannerButton: {
    position: "absolute",
    left: 17,
    bottom: 17,
    zIndex: 3,
    height: 35,
    borderRadius: 99,
    backgroundColor: "rgba(76,55,42,.34)",
    paddingBottom: 3,
    overflow: "visible",
    shadowColor: "#111111",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  goalBannerButtonFace: {
    height: 32,
    borderRadius: 99,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.78)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    overflow: "hidden",
  },
  goalBannerButtonGloss: {
    position: "absolute",
    left: 8,
    right: 8,
    top: 2,
    height: 11,
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,.58)",
  },
  goalBannerButtonText: {
    color: "#111111",
    fontFamily: systemFont,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "900",
  },
  goalBannerImage: {
    position: "absolute",
    left: 0,
    right: 0,
    width: "100%",
    height: "100%",
    top: 10,
    bottom: -10,
  },
  categoryRow: {
    gap: 15,
    paddingTop: 11,
    paddingHorizontal: 20,
  },
  categoryItem: {
    width: 68,
    alignItems: "center",
    gap: 8,
  },
  categoryPhoto: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  categoryLabel: {
    fontFamily: systemFont,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  scheduleCalendarRow: {
    flexDirection: "row",
    gap: 6,
    paddingTop: 11,
  },
  scheduleCalendarDay: {
    flex: 1,
    minWidth: 0,
    height: 78,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 7,
  },
  scheduleCalendarDaySelected: {
    shadowColor: "#D84A0A",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.24,
    shadowRadius: 8,
    elevation: 5,
  },
  scheduleCalendarDayName: {
    fontFamily: systemFont,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "700",
    position: "absolute",
    top: 10,
  },
  scheduleCalendarDateBubble: {
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    left: 5,
    right: 5,
    bottom: 5,
  },
  scheduleCalendarDate: {
    fontFamily: systemFont,
    fontSize: 14,
    lineHeight: 17,
    fontWeight: "800",
  },
  scheduleSelection: {
    minHeight: 50,
    borderRadius: 15,
    borderWidth: 1,
    paddingHorizontal: 13,
    marginTop: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  scheduleSelectionTitle: {
    fontFamily: systemFont,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "800",
  },
  scheduleSelectionMeta: {
    fontFamily: systemFont,
    fontSize: 9,
    lineHeight: 12,
    marginTop: 1,
  },
  strengthFeature: {
    width: "100%",
    aspectRatio: 16 / 10,
    borderRadius: 22,
    overflow: "hidden",
    padding: 0,
  },
  strengthFeatureImage: { borderRadius: 22 },
  strengthFeatureCopy: {
    position: "absolute",
    left: 17,
    bottom: 17,
    zIndex: 2,
    alignItems: "flex-start",
  },
  strengthFeatureTitle: {
    color: "#FFFFFF",
    fontFamily: systemFont,
    fontSize: 22,
    lineHeight: 23,
    fontWeight: "900",
    letterSpacing: -0.45,
  },
  strengthFeatureActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  strengthFeatureTime: {
    height: 34,
    paddingHorizontal: 11,
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.26)",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  strengthFeatureTimeText: {
    color: "#FFFFFF",
    fontFamily: systemFont,
    fontSize: 11,
    fontWeight: "800",
  },
  strengthFeaturePlay: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  workoutPagination: {
    height: 15,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 5,
  },
  workoutSlider: { marginTop: 11 },
  workoutSliderContent: {
    gap: 12,
    paddingHorizontal: 20,
  },
  fullBleedScroller: { marginHorizontal: -20 },
  workoutPaginationDot: {
    height: 6,
    borderRadius: 99,
  },
  homeHero: {
    height: 220,
    borderRadius: 26,
    overflow: "hidden",
    padding: 18,
    justifyContent: "space-between",
  },
  homeHeroImage: { borderRadius: 26 },
  homeHeroShade: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(10,7,5,.48)",
  },
  homeHeroBadge: {
    alignSelf: "flex-start",
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.28)",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  homeHeroBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  homeHeroCopy: { alignItems: "flex-start" },
  homeHeroTitle: {
    color: "#fff",
    fontSize: 28,
    lineHeight: 30,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  homeHeroSubtitle: {
    color: "rgba(255,255,255,.78)",
    fontSize: 12,
    marginTop: 6,
  },
  homeHeroButton: {
    height: 38,
    borderRadius: 99,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 14,
  },
  homeHeroButtonText: { color: "#fff", fontSize: 12, fontWeight: "900" },
  trainerCarousel: { gap: 12, paddingTop: 45, paddingBottom: 3 },
  trainerTile: {
    height: 158,
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    justifyContent: "center",
    overflow: "visible",
  },
  coachImageLayer: {
    position: "absolute",
    width: 164,
    height: 205,
    right: -2,
    bottom: 0,
    zIndex: 5,
    elevation: 5,
    overflow: "visible",
  },
  trainerCutout: { width: "100%", height: "100%" },
  trainerTileCopy: { width: "55%", gap: 3, zIndex: 6 },
  trainerSpecialty: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  trainerName: { fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
  trainerDescription: { fontSize: 11, lineHeight: 15, marginTop: 2 },
  trainerTileAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  rowTitle: { fontSize: 16, fontWeight: "800" },
  workoutHero: {
    height: 230,
    borderRadius: 24,
    overflow: "hidden",
    padding: 16,
    justifyContent: "space-between",
  },
  workoutImage: { borderRadius: 24 },
  workoutShade: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,.28)",
  },
  levelPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,.36)",
    borderColor: "rgba(255,255,255,.28)",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 99,
  },
  levelText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  workoutCopy: { maxWidth: 220 },
  workoutTitle: { color: "#fff", fontSize: 26, fontWeight: "900" },
  workoutSubtitle: {
    color: "rgba(255,255,255,.78)",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
  workoutActions: { flexDirection: "row", gap: 8, marginTop: 14 },
  timePill: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 99,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  scheduleList: { gap: 9 },
  scheduleCard: {
    minHeight: 72,
    borderRadius: 20,
    borderWidth: 1,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dateBlock: {
    width: 52,
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  dateDay: { fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  dateTime: { fontSize: 14, fontWeight: "900", marginTop: 2 },
  schedulePlay: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  search: {
    height: 56,
    borderRadius: 19,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  chip: { paddingHorizontal: 16, paddingVertical: 11, borderRadius: 14 },
  workoutList: { gap: 13 },
  exploreCard: { height: 154, borderRadius: 22, overflow: "hidden" },
  exploreImage: { flex: 1, borderRadius: 22 },
  exploreShade: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(5,5,5,.42)",
  },
  exploreContent: { flex: 1, padding: 14, justifyContent: "space-between" },
  exploreTop: { flexDirection: "row", justifyContent: "space-between" },
  darkPill: {
    alignSelf: "flex-start",
    height: 25,
    paddingHorizontal: 9,
    borderRadius: 99,
    backgroundColor: "rgba(0,0,0,.34)",
    borderColor: "rgba(255,255,255,.25)",
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  darkPillText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  exploreTitle: { color: "#fff", fontSize: 21, fontWeight: "900" },
  exploreTrainer: {
    color: "rgba(255,255,255,.72)",
    fontSize: 11,
    marginTop: 1,
  },
  exploreActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 9,
  },
  whiteTimePill: {
    height: 32,
    paddingHorizontal: 11,
    borderRadius: 99,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  explorePlay: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  progressVideoList: { gap: 12 },
  progressVideoCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  progressVideoImage: {
    width: 92,
    height: 92,
    borderRadius: 15,
    backgroundColor: "#191919",
  },
  progressVideoBody: { flex: 1, gap: 9 },
  progressVideoHeading: { flexDirection: "row", alignItems: "center", gap: 8 },
  progressVideoTitle: { fontFamily: systemFont, fontSize: 14, lineHeight: 18, fontWeight: "800" },
  progressVideoMeta: { fontFamily: systemFont, fontSize: 10, lineHeight: 13, marginTop: 3 },
  progressResumeButton: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  progressTrack: { height: 7, borderRadius: 999, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 999 },
  progressTimes: { flexDirection: "row", justifyContent: "space-between", marginTop: -4 },
  progressTime: { fontFamily: systemFont, fontSize: 9, lineHeight: 11, fontWeight: "600" },
  progressEmptyCard: {
    position: "relative",
    overflow: "hidden",
    borderWidth: 1,
    borderRadius: 26,
    paddingHorizontal: 24,
    paddingVertical: 30,
    alignItems: "center",
  },
  progressEmptyDecorationOne: {
    position: "absolute",
    width: 125,
    height: 125,
    borderRadius: 63,
    backgroundColor: "rgba(255,103,31,0.06)",
    top: -58,
    right: -38,
  },
  progressEmptyDecorationTwo: {
    position: "absolute",
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(255,103,31,0.045)",
    bottom: 50,
    left: -35,
  },
  progressEmptyIconHalo: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  progressEmptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#E34B0A",
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: .22,
    shadowRadius: 10,
    elevation: 5,
  },
  progressEmptyTitle: {
    fontFamily: systemFont,
    fontSize: 22,
    lineHeight: 27,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -.35,
  },
  progressEmptyCopy: {
    fontFamily: systemFont,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 8,
    maxWidth: 300,
  },
  progressEmptyCta: {
    width: "100%",
    height: 50,
    borderRadius: 25,
    marginTop: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    shadowColor: "#E34B0A",
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: .2,
    shadowRadius: 10,
    elevation: 4,
  },
  progressEmptyCtaText: {
    fontFamily: systemFont,
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "800",
  },
  progressEmptyTrustRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 15,
  },
  progressEmptyTrustText: {
    fontFamily: systemFont,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "600",
  },
  coachProfilePage: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 20,
  },
  coachProfileHero: {
    height: 390,
    borderRadius: 28,
    borderWidth: 1,
    overflow: "hidden",
  },
  coachProfileAccent: {
    position: "absolute",
    width: 230,
    height: 230,
    borderRadius: 115,
    top: 45,
    right: -60,
  },
  coachProfilePhoto: {
    position: "absolute",
    left: 8,
    right: 8,
    top: 14,
    bottom: 0,
    width: undefined,
    height: undefined,
  },
  coachProfileHeroShade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 150,
  },
  coachProfileIdentity: { position: "absolute", left: 20, right: 20, bottom: 20 },
  coachProfileSpecialty: {
    color: "#FF8A4C",
    fontFamily: systemFont,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  coachProfileName: {
    color: "#FFFFFF",
    fontFamily: systemFont,
    fontSize: 31,
    lineHeight: 37,
    fontWeight: "900",
    letterSpacing: -.8,
    marginTop: 3,
  },
  coachStatsRow: { flexDirection: "row", gap: 9 },
  coachStat: {
    flex: 1,
    minWidth: 0,
    height: 75,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  coachStatValue: { fontFamily: systemFont, fontSize: 18, lineHeight: 22, fontWeight: "900" },
  coachStatLabel: { fontFamily: systemFont, fontSize: 9, lineHeight: 12, fontWeight: "600", marginTop: 3 },
  coachProfileSection: { gap: 8 },
  coachProfileHeading: { fontFamily: systemFont, fontSize: 20, lineHeight: 25, fontWeight: "900", letterSpacing: -.3 },
  coachProfileBio: { fontFamily: systemFont, fontSize: 13, lineHeight: 21 },
  coachExpertiseWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  coachExpertiseChip: {
    minHeight: 37,
    borderRadius: 19,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  coachExpertiseText: { fontFamily: systemFont, fontSize: 11, lineHeight: 14, fontWeight: "700" },
  coachApproachCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  coachApproachIcon: { width: 44, height: 44, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  coachApproachTitle: { fontFamily: systemFont, fontSize: 13, lineHeight: 17, fontWeight: "900" },
  coachApproachCopy: { fontFamily: systemFont, fontSize: 10, lineHeight: 15, marginTop: 3 },
  categoryVideosPage: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    gap: 18,
  },
  categoryVideosIntro: { gap: 5, marginTop: -4 },
  categoryVideosCount: {
    fontFamily: systemFont,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  categoryVideosDescription: {
    fontFamily: systemFont,
    fontSize: 13,
    lineHeight: 19,
    maxWidth: 340,
  },
  categoryVideosList: { gap: 14 },
  categoryVideoCard: {
    height: 210,
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
  },
  categoryVideoImageWrap: {
    flex: 1,
    padding: 15,
    justifyContent: "space-between",
  },
  categoryVideoImage: { borderRadius: 23 },
  categoryVideoTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  categoryVideoNumber: {
    width: 34,
    height: 27,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,.92)",
  },
  categoryVideoNumberText: {
    color: "#171715",
    fontFamily: systemFont,
    fontSize: 10,
    fontWeight: "900",
  },
  categoryVideoDuration: {
    height: 29,
    borderRadius: 15,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,.45)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.2)",
  },
  categoryVideoDurationText: {
    color: "#FFFFFF",
    fontFamily: systemFont,
    fontSize: 10,
    fontWeight: "800",
  },
  categoryVideoBottomRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  categoryVideoTitle: {
    color: "#FFFFFF",
    fontFamily: systemFont,
    fontSize: 21,
    lineHeight: 25,
    fontWeight: "900",
    letterSpacing: -.4,
  },
  categoryVideoMeta: {
    color: "rgba(255,255,255,.75)",
    fontFamily: systemFont,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "600",
    marginTop: 4,
  },
  categoryVideoPlay: {
    width: 45,
    height: 45,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  trainersPage: { paddingHorizontal: 20, paddingBottom: 42, gap: 22 },
  trainersList: { gap: 14 },
  trainersCard: {
    minHeight: 184,
    borderRadius: 24,
    borderWidth: 1,
    padding: 12,
    flexDirection: "row",
    gap: 15,
    overflow: "hidden",
  },
  trainersPhotoWrap: {
    width: 128,
    minHeight: 158,
    borderRadius: 18,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  trainersPhoto: { width: "100%", height: "100%" },
  trainersCardCopy: { flex: 1, paddingVertical: 8, justifyContent: "center" },
  trainersSpecialty: { fontFamily: systemFont, fontSize: 9, fontWeight: "900", letterSpacing: 1.1 },
  trainersName: { fontFamily: systemFont, fontSize: 20, lineHeight: 25, fontWeight: "900", marginTop: 4 },
  trainersBio: { fontFamily: systemFont, fontSize: 11, lineHeight: 16, marginTop: 5 },
  trainersMetaRow: { flexDirection: "row", gap: 12, marginTop: 9 },
  trainersMeta: { fontFamily: systemFont, fontSize: 10, fontWeight: "800" },
  trainersProfileLink: { flexDirection: "row", alignItems: "center", gap: 2, marginTop: 10 },
  infoHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  subscriptionTitle: { fontSize: 23, fontWeight: "900" },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
  },
});
