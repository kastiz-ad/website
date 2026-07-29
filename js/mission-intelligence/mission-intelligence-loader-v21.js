import japanTrip from "./playbooks/travel/japan-trip.js";
import childEnglishPerformanceDecline from "./playbooks/education/child-english-performance-decline.js";
import findMiddleSchoolEnglishAcademy from "./playbooks/education/find-middle-school-english-academy.js";
import sameDayToothPain from "./playbooks/healthcare/same-day-tooth-pain.js";
import cancerCenterNavigation from "./playbooks/healthcare/cancer-center-navigation.js";
import openPharmacy from "./playbooks/healthcare/open-pharmacy.js";
import sinkLeak from "./playbooks/home-services/sink-leak.js";
import moveToKorea from "./playbooks/immigration/move-to-korea.js";
import startCompanyKorea from "./playbooks/business/start-company-korea.js";
import findJobKorea from "./playbooks/career/find-job-korea.js";
import immigrationLawyer from "./playbooks/professional-services/immigration-lawyer.js";
import datePlan from "./playbooks/events/date-plan.js";
import { assertValidMissionPlaybooks } from "./mission-intelligence-validator-v21.js";

export const INITIAL_MISSION_PLAYBOOKS_V21 = Object.freeze([
  japanTrip,
  childEnglishPerformanceDecline,
  findMiddleSchoolEnglishAcademy,
  sameDayToothPain,
  cancerCenterNavigation,
  openPharmacy,
  sinkLeak,
  moveToKorea,
  startCompanyKorea,
  findJobKorea,
  immigrationLawyer,
  datePlan
]);

export function loadMissionIntelligencePlaybooks({ validate = true } = {}) {
  if (validate) assertValidMissionPlaybooks(INITIAL_MISSION_PLAYBOOKS_V21);
  return INITIAL_MISSION_PLAYBOOKS_V21;
}
