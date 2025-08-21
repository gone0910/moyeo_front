import { StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;
function normalize(size, based = 'width') {
  const scale = based === 'height' ? SCREEN_HEIGHT / BASE_HEIGHT : SCREEN_WIDTH / BASE_WIDTH;
  return Math.round(size * scale);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: normalize(105, 'height'),
    backgroundColor: '#Fafafa',
    zIndex: 10,
    paddingTop: normalize(20, 'height'),
  },
  wrapper: {
    paddingBottom: normalize(100, 'height'),
    backgroundColor: '#fafafa',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: normalize(20),
    marginBottom: normalize(10),
  },
  logoText: {
    fontSize: normalize(40),
    fontFamily: 'KaushanScript_400Regular',
    color: '#4F46E5',
    lineHeight: normalize(80, 'height'),
    letterSpacing: 0,
    top: normalize(15, 'height'),
  },
  profileImage: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
    backgroundColor: '#ccc',
    marginTop: normalize(30),
    top: normalize(5),
  },
  headerLine: {
    width: '90%',
    marginBottom: normalize(10),
    alignSelf: 'center',
    height: 1,
    backgroundColor: '#999',
  },
  asterisk: {
  color: '#EF4444',   // 빨간색
  fontWeight: 'bold',
  fontSize: 20,
  },
  divider: {
    width: '90%',
    height: 1,
    backgroundColor: '#E6E6E6',
    alignSelf: 'center',
    marginTop: normalize(10),
    marginBottom: normalize(10),
    top: normalize(-20),
  },
  calendarBox: {
    paddingHorizontal: normalize(20),
    marginTop: normalize(20),
    top: normalize(-110),
    backgroundColor:'#fafafa',
  },
  calendarLabel: {
    fontSize: normalize(18),
    fontWeight: '400',
    fontFamily: 'Roboto',
    lineHeight: normalize(24, 'height'),
    color: '#000',
    marginBottom: normalize(10),
    top: normalize(-9),
  },
  dateButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: normalize(10),
    backgroundColor:'#fafafa',
    marginTop: normalize(-10),
    marginBottom: normalize(12),
  },
  dateButton: {
    backgroundColor: '#EAE6FB',
    paddingVertical: normalize(8),
    paddingHorizontal: normalize(14),
    borderRadius: normalize(10),
    minWidth: normalize(150),
    alignItems: 'center',
    top:normalize(25),
  },
  dateButtonText: {
    fontSize: normalize(16),
    fontFamily: 'Roboto',
    color: '#373737',
    fontWeight: '500',
  },
  fixedButtonContainer1: {
    position: 'absolute',
    bottom: normalize(35),
    left: normalize(16),
    right: normalize(16),
    alignItems: 'center',
  },
  fixedButtonContainer2: {
    position: 'absolute',
    bottom: normalize(35),
    left: normalize(16),
    right: normalize(16),
    alignItems: 'center',
  },
  fixedButton1: {
    width: normalize(358),
    height: normalize(50),
    backgroundColor: '#FFF',
    borderRadius: normalize(10),
    justifyContent: 'center',
    alignItems: 'center',
    top: normalize(-42),
    borderWidth: 2,
    borderColor: '#4F46E5',
  },
  fixedButton2: {
    width: normalize(358),
    height: normalize(50),
    backgroundColor: '#4F46E5',
    borderRadius: normalize(10),
    justifyContent: 'center',
    alignItems: 'center',
    top: normalize(20),
  },
  fixedButtonText1: {
    fontSize: normalize(18),
    fontFamily: 'Inter',
    color: '#4F46E5',
    fontWeight: '500',
    lineHeight: normalize(22, 'height'),
  },
  fixedButtonText2: {
    fontSize: normalize(18),
    fontFamily: 'Inter',
    color: '#FFFFFF',
    fontWeight: '500',
    lineHeight: normalize(22, 'height'),
  },
  slideIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: normalize(80),
    left: '53%',
    transform: [{ translateX: -50 }],
    zIndex: 10,
  },
  slideDot: {
    width: normalize(10),
    height: normalize(10),
    borderRadius: normalize(5),
    margin: normalize(5),
  },
  activeDot: {
    backgroundColor: '#616161',
  },
  inactiveDot: {
    backgroundColor: '#C4C4C4',
  },
  firstTitle: {
    fontSize: normalize(18),
    top:normalize(-15),
    left: normalize(5),
  },
  secondTitle: {
    fontSize: normalize(18),
    top:normalize(26),
    left: normalize(5),
  },
  thirdTitle: {
    fontSize: normalize(18),
    top:normalize(25),
    left: normalize(5),
  },
  thirdTitlesmall: {
    color:'#7E7E7E',
    marginLeft:normalize(5),
    fontSize: normalize(14),
  },
  divider1: {
    width: '100%',
    height: 1,
    backgroundColor: '#E6E6E6',
    alignSelf: 'center',
    marginTop: normalize(10),
    marginBottom: normalize(10),
    top:normalize(-7)
  },
  divider2: {
    width: '100%',
    height: 1,
    backgroundColor: '#E6E6E6',
    alignSelf: 'center',
    marginTop: normalize(60),
    marginBottom: normalize(10),
    top:normalize(-15)
  },
  divider3: {
    width: '100%',
    height: 1,
    backgroundColor: '#E6E6E6',
    alignSelf: 'center',
    marginTop: normalize(50),
    marginBottom: normalize(10),
    top:0
  },
  divider4: {
    width: '100%',
    height: 1,
    backgroundColor: '#E6E6E6',
    alignSelf: 'center',
    marginTop: normalize(10),
    marginBottom: normalize(5),
    top:normalize(-7)
  },
  sliderLabel: {
    fontSize: normalize(12),
    color: '#7E7E7E',
  },
  budgetValueBox: {
    backgroundColor: '#EAE6FD',
    paddingVertical: normalize(6),
    paddingHorizontal: normalize(14),
    borderRadius: normalize(20),
    alignSelf: 'center',
    marginTop: normalize(12),
  },
  budgetValueText: {
    fontSize: normalize(14),
    color: '#000',
    fontWeight: '400',
    textAlign: 'center',
  },
  disabledBudgetBox: {
    backgroundColor: '#E6E6E6',
  },  
  disabledText: {
    color: '#333',
  },
  customPlanButtonContainer: {
    position: 'absolute',
    bottom: normalize(35),
    left: normalize(16),
    right: normalize(16),
  },
  customPlanButton: {
    width: normalize(358),
    height: normalize(50),
    backgroundColor: '#4F46E5',
    borderRadius: normalize(10),
    justifyContent: 'center',
    alignItems: 'center',
    top: normalize(20),
  },
  customPlanButtonText: {
    fontSize: normalize(18),
    fontFamily: 'Inter',
    color: '#FFFFFF',
    fontWeight: '500',
    lineHeight: normalize(22, 'height'),
  },
});

export { normalize };
export default styles;