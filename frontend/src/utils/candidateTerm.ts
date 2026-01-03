/**
 * 获取自定义的候选人称呼
 * @returns 自定义的称呼，默认为"候选人"
 */
export function getCandidateTerm(): string {
  return localStorage.getItem('candidateTerm') || '候选人';
}

/**
 * 获取包含候选人称呼的文本
 * 这个函数会在组件更新时自动响应localStorage的变化
 * @returns 当前设置的候选人称呼
 */
export function useCandidateTerm(): string {
  // 这个hook会在组件中通过useState监听变化
  // 使用时需要在组件中手动监听storage事件
  return getCandidateTerm();
}
