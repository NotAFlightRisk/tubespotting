import type { Messages } from './en.js';

export default {
  title: '伦敦地铁实时地图',
  about: '关于',
  close: '关闭',
  waiting: '正在等待 TfL…',
  checkFront: '请查看列车车头',
  due: '即将到站',
  minutes: (n: number) => `${n} 分钟`,
  seconds: (n: number) => `${n} 秒`,
  trains: { other: '# 趟列车' },
  feed: {
    connecting: '正在连接',
    unreachable: '无法连接 TfL',
    behind: (time: string) => `延迟 ${time}`,
    catchingUp: '正在更新',
    live: '实时'
  },
  where: {
    at: (station: string) => `位于 ${station}`,
    approaching: (station: string) => `即将到达 ${station}`,
    between: (from: string, to: string) => `${from} 与 ${to} 之间`
  },
  map: {
    label: { other: '伦敦地铁地图，# 趟列车正在实时运行' },
    keys: '方向键移动地图，加号和减号缩放。线路列表、搜索和车站信息板包含地图上的全部内容。'
  },
  page: {
    search: '搜索',
    settings: '设置',
    aboutMap: '关于此地图',
    details: '详情',
    back: '返回所有线路',
    allLines: '所有线路',
    style: '地铁线路图',
    toGeographic: '显示真实地理位置',
    toSchematic: '显示地铁线路图',
    zoomIn: '放大',
    zoomOut: '缩小',
    locate: '显示我的位置'
  },
  notice: {
    unsupported: '此浏览器无法共享你的位置',
    noLines: '请开启一些线路以查找最近的车站',
    far: (km: number) => `你距离最近的车站 ${km} 公里`,
    failed: '无法获取你的位置'
  },
  board: {
    lines: '线路',
    checking: '查询中',
    onMap: '地图显示',
    none: '无线路',
    only: (mode: string) => `仅 ${mode}`,
    every: '所有线路'
  },
  line: {
    checking: '正在查询运营状态',
    running: { other: '# 趟列车运行中' },
    to: (place: string) => `开往 ${place}`,
    trainsTo: (place: string) => `开往 ${place} 的列车`
  },
  station: {
    lines: '线路',
    platform: '站台',
    platformOf: (line: string, platform: string) => `${line} 线，${platform}`,
    terminating: '没有发车信息，只有在本站终到的列车。',
    arrivingNow: '下一班现在到站。',
    arrivingIn: (time: string) => `下一班 ${time}后到站。`,
    none: '目前本站没有即将到站的列车。'
  },
  train: {
    gone: '这趟列车已消失',
    goneWhy: 'TfL 已停止报告这趟列车，它可能已到达终点站。',
    to: (place: string) => `开往 ${place}`,
    unknown: '列车，目的地请看车头',
    follow: '跟随这趟列车',
    following: '正在跟随这趟列车',
    stops: '后续停靠站'
  },
  search: {
    line: (name: string) => `${name} 线`,
    kind: '线路',
    find: '查找车站或线路',
    close: '关闭搜索',
    matches: '搜索结果',
    nothing: '地铁里没有叫这个名字的车站或线路。'
  },
  settings: {
    title: '设置',
    general: '通用',
    map: '地图',
    accessibility: '辅助功能',
    privacy: '隐私',
    theme: { label: '主题', hint: '在你选择之前跟随设备' },
    light: '浅色',
    dark: '深色',
    language: { label: '语言', hint: '在你选择之前跟随设备' },
    layout: { label: '布局' },
    schematic: '地铁线路图',
    geographic: '地理视图',
    zoom: { label: '缩放' },
    modes: { label: '地图上的线路' },
    locate: { label: '显示我的位置', hint: '你的位置信息不会离开你的设备' },
    refresh: { label: '更新间隔', hint: '间隔越长，流量越少' },
    calm: { label: '减少动态效果', hint: '更少动画，地图不再滑动' },
    contrast: { label: '增强对比度', hint: '文字和边框更清晰' },
    shortcuts: { label: '键盘快捷键', hint: '按 / 搜索' },
    analytics: { label: '使用统计', hint: 'Plausible 统计访问量，不使用 Cookie，也不收集个人数据' },
    errors: { label: '错误报告', hint: '出现问题时发送一份已脱敏的报告，方便我们修复' },
    clear: { label: '清除所有数据', hint: '重置此浏览器中保存的所有内容' },
    clearButton: '清除',
    cleared: '已清除',
    clearedAll: '所有数据已清除'
  },
  error: {
    lost: '不在地图上',
    broken: '出错了',
    noTrains: '没有列车停靠这里',
    outOfService: '暂停服务',
    missing: '地图上没有这个页面。',
    back: '返回实时地图'
  }
} satisfies Messages;
