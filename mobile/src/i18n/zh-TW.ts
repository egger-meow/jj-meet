// Traditional Chinese translations for JJ-Meet
// 繁體中文翻譯 - 台灣年輕人語感

export const zhTW = {
  // Common
  common: {
    loading: '載入中...',
    error: '發生錯誤',
    retry: '重試',
    cancel: '取消',
    confirm: '確認',
    save: '儲存',
    delete: '刪除',
    edit: '編輯',
    done: '完成',
    next: '下一步',
    back: '返回',
    skip: '跳過',
    search: '搜尋',
    noData: '暫無資料',
  },

  // Auth
  auth: {
    welcomeBack: '歡迎回來',
    signInSubtitle: '登入繼續你的旅程',
    email: '電子郵件',
    emailPlaceholder: 'your@email.com',
    password: '密碼',
    passwordPlaceholder: '••••••••',
    confirmPassword: '確認密碼',
    rememberMe: '記住我',
    forgotPassword: '忘記密碼？',
    signIn: '登入',
    signUp: '註冊',
    orContinueWith: '或使用以下方式',
    noAccount: '還沒有帳號？',
    hasAccount: '已經有帳號了？',
    signUpNow: '立即註冊',
    signInNow: '立即登入',
    loginFailed: '登入失敗',
    registerSuccess: '歡迎加入 JJ-Meet！',
    registerFailed: '註冊失敗',
  },

  // Register
  register: {
    joinTitle: '加入 JJ-Meet',
    stepOf: '第 {step} 步，共 3 步',
    
    // Step 1
    emailRequired: '請輸入電子郵件',
    invalidEmail: '電子郵件格式不正確',
    passwordRequired: '請輸入密碼',
    passwordMinLength: '密碼至少需要 6 個字元',
    passwordMismatch: '密碼不一致',
    
    // Step 2
    name: '暱稱',
    namePlaceholder: '你的名字',
    nameRequired: '請輸入暱稱',
    birthDate: '生日',
    birthDatePlaceholder: 'YYYY-MM-DD',
    birthDateRequired: '請輸入生日',
    socialLink: 'IG / 社群連結（用於驗證）',
    socialLinkPlaceholder: 'instagram.com/yourusername',
    gender: '性別',
    male: '男生',
    female: '女生',
    other: '其他',
    
    // Step 3
    aboutMe: '關於我',
    aboutMeHint: '讓其他人更認識你',
    hasCar: '我有車',
    hasMotorcycle: '我有機車',
    speaksEnglish: '我會說英文',
    speaksLocal: '我會說當地語言',
    flexibleSchedule: '時間彈性',
    bio: '自我介紹（選填）',
    bioPlaceholder: '介紹一下你自己...',
    complete: '完成註冊',
    
    // MBTI
    mbti: '你的 MBTI',
    mbtiHint: '選擇你的人格類型（I人還是E人？）',
    mbtiPlaceholder: '選擇 MBTI',
  },

  // Discovery / Swipe
  discovery: {
    title: '探索',
    findingPeople: '正在尋找附近的旅伴...',
    noMoreProfiles: '沒有更多檔案了',
    checkBackLater: '稍後再回來看看，或擴大搜尋範圍',
    refresh: '重新整理',
    filters: '篩選',
  },

  // Matches
  matches: {
    title: '配對成功',
    noMatchesYet: '還沒有配對',
    startSwiping: '開始滑動來找旅伴吧',
    newMatch: '新配對！',
    sayHi: '打個招呼',
  },

  // Profile
  profile: {
    title: '我的檔案',
    editProfile: '編輯個人資料',
    managePhotos: '管理照片',
    verification: '身份驗證',
    notifications: '通知設定',
    logOut: '登出',
    noBioYet: '還沒有自我介紹，點擊新增！',
    localGuide: '在地嚮導',
  },

  // Settings
  settings: {
    title: '設定',
    account: '帳號',
    changePassword: '更改密碼',
    privacySafety: '隱私與安全',
    notifications: '通知',
    pushNotifications: '推播通知',
    emailPreferences: '電子郵件偏好',
    discovery: '探索設定',
    locationServices: '定位服務',
    showDistance: '顯示距離',
    discoveryPreferences: '探索偏好設定',
    support: '支援',
    helpCenter: '幫助中心',
    contactUs: '聯絡我們',
    termsOfService: '服務條款',
    privacyPolicy: '隱私政策',
    accountActions: '帳號操作',
    deactivateAccount: '停用帳號',
    deleteAccount: '刪除帳號',
    version: '版本',
    logOutConfirm: '確定要登出嗎？',
    deactivateConfirm: '你的個人資料將對其他使用者隱藏。隨時可以重新登入啟用。',
    deleteConfirm: '此操作無法復原。所有資料將被永久刪除。',
  },

  // Trips
  trips: {
    title: '我的旅程',
    noTrips: '還沒有規劃旅程',
    planTrip: '規劃旅程',
    startPlanning: '開始規劃你的下一趟冒險，找到同行的旅伴！',
    currentlyTraveling: '旅行中',
    activeNow: '進行中',
    tomorrow: '明天',
    inDays: '{days} 天後',
    days: '天',
    findTravelers: '尋找旅伴與嚮導',
    discovering: '探索中',
    createTrip: '新增旅程',
    destination: '目的地',
    startDate: '開始日期',
    endDate: '結束日期',
    travelStyle: '旅行風格',
    description: '旅程描述',
  },

  // Chat
  chat: {
    typeMessage: '輸入訊息...',
    send: '傳送',
    today: '今天',
    yesterday: '昨天',
  },

  // SwipeCard
  swipeCard: {
    guide: '嚮導',
    verified: '已驗證',
    kmAway: '{distance} 公里',
    hasCar: '有車',
    hasMotorcycle: '有機車',
  },

  // MBTI Types
  mbti: {
    INTJ: 'INTJ 建築師',
    INTP: 'INTP 邏輯學家',
    ENTJ: 'ENTJ 指揮官',
    ENTP: 'ENTP 辯論家',
    INFJ: 'INFJ 提倡者',
    INFP: 'INFP 調停者',
    ENFJ: 'ENFJ 主人公',
    ENFP: 'ENFP 競選者',
    ISTJ: 'ISTJ 物流師',
    ISFJ: 'ISFJ 守衛者',
    ESTJ: 'ESTJ 總經理',
    ESFJ: 'ESFJ 執政官',
    ISTP: 'ISTP 鑑賞家',
    ISFP: 'ISFP 探險家',
    ESTP: 'ESTP 企業家',
    ESFP: 'ESFP 表演者',
  },

  // Alerts
  alerts: {
    success: '成功',
    error: '錯誤',
    warning: '警告',
    info: '提示',
  },
};

export default zhTW;
