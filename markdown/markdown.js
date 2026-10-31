/** 会话 Markdown 美化子插件：样式与行为在浏览器端入口 client.js；此处只登记一个服务名，供主插件判断本子插件是否在运行。 */
export const name = 'heipm-markdown'

export const SERVICE_NAME = 'heipmMarkdown'

/** 服务值只作为「已加载」标记，主插件读它来决定样式开或关。 */
export function apply(ctx) {
  ctx.provide(SERVICE_NAME, { enabled: true })
}
