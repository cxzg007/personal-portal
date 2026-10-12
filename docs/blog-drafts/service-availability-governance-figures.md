# 《服务可用性治理》配图安排

五张配图分别放在正文第 2、3、4、5、8 节。时序、分叉、状态转换、资源对比和反馈环路各自解释一种机制；第 6 节继续保留限流算法对照表，便于横向阅读。

采用白底、手绘线条、浅色排线和手写风格字体。蓝色表示正常链路，绿色表示成功或可用，红色表示异常或拒绝，黄色表示探测与调整。所有数值均为教学示例，不是项目实测数据。

| 位置与主题 | 正文配图 | 矢量图片 | 可编辑源文件 |
| --- | --- | --- | --- |
| 第 2 节：幂等重试时序 | [PNG](figures/service-availability/idempotent-retry.png) | [SVG](figures/service-availability/idempotent-retry.svg) | [Excalidraw](figures/service-availability/idempotent-retry.excalidraw) |
| 第 3 节：级联重试放大 | [PNG](figures/service-availability/retry-amplification.png) | [SVG](figures/service-availability/retry-amplification.svg) | [Excalidraw](figures/service-availability/retry-amplification.excalidraw) |
| 第 4 节：熔断状态转换 | [PNG](figures/service-availability/circuit-breaker.png) | [SVG](figures/service-availability/circuit-breaker.svg) | [Excalidraw](figures/service-availability/circuit-breaker.excalidraw) |
| 第 5 节：舱壁隔离对比 | [PNG](figures/service-availability/bulkhead-isolation.png) | [SVG](figures/service-availability/bulkhead-isolation.svg) | [Excalidraw](figures/service-availability/bulkhead-isolation.excalidraw) |
| 第 8 节：自适应并发反馈 | [PNG](figures/service-availability/adaptive-concurrency.png) | [SVG](figures/service-availability/adaptive-concurrency.svg) | [Excalidraw](figures/service-availability/adaptive-concurrency.excalidraw) |

## 1. 幂等重试时序

放在数据库防重表与本地事务的说明之后。以请求 `pay-42` 扣款 100 元为例：首次调用在一个数据库事务内完成余额修改、唯一请求记录和成功结果的提交，随后成功响应丢失。调用方超时后仍携带 `pay-42`，扣款服务识别重复请求并查询已保存结果，避免再次扣款。

图中把数据库提交放在响应丢失之前，用时间顺序解释“超时不能证明业务没有执行”。绿色区域明确标出事务边界，避免把独立的 Redis 防重标记误解为业务提交。图示只展开首次已提交成功的分支；处理中、失败和参数冲突保留在正文中说明。

## 2. 级联重试放大

放在三层调用的例子之后，替换原来的单行乘法代码块。树形结构展示一次入口请求到达 B 时最多形成 3 次尝试，到达 C 时最多形成 9 次尝试，每次 C 调用再最多访问数据库 3 次，累计上限为 27 次。

每条数据库箭头单独标注 `×3`，对应上方的一次 C 调用。图内注明“三次总尝试 = 首次调用 + 两次重试”，并说明分叉表达累计次数，不代表同时并发执行。持续失败与足够的时间预算是达到该上限的前提。

## 3. 熔断状态转换

放在半开恢复过程的说明之后。关闭状态正常放行；统计窗口内样本足够、失败率或慢调用比例达到条件时开启熔断，快速拒绝后续调用。等待后进入半开状态，只允许有限探测；满足成功条件则恢复关闭，未通过则重新开启。

绿色恢复路径与红色重新熔断路径形成不同方向的环路，帮助读者区分“时间到了”和“下游恢复了”。开启状态暂停访问故障下游，拒绝后的业务响应由降级策略决定。

## 4. 舱壁隔离对比

放在线程池隔离的说明之后，信号量隔离之前。左右两边均有 12 个执行线程，使用格子表示资源份额。共享池可能被地理位置慢查询全部占满；独立池按内容、关系和地理位置各分配 4 个线程后，慢依赖只能占用自己的份额。

左右总预算相同，使读者能够看到效果来自隔离边界，而不是增加线程。红色格子表示慢调用占用，绿色表示正常执行，空白表示可用；图内同时说明线程隔离不自动覆盖共享连接池、等待队列及资源释放路径。

## 5. 自适应并发反馈

放在 Gradient 公式与调整方向的说明之后、BBR limiter 之前。请求经并发准入后执行，结束时采样延迟并归还许可；控制器比较基准延迟和当前延迟，调整后续请求的并发上限，形成反馈环路。

示例取基准延迟 50 毫秒、当前延迟 100 毫秒、当前上限 100，假设探索余量为 5，则简化关系得到约 55 个请求的并发上限。图内明确省略了实际实现的容忍系数、比率限制、平滑与探测，并指出调节对象是并发数量，而非 QPS。降低上限只影响后续准入，不会强制终止已进入的请求。

## 文件使用

正文使用约 2,000 像素宽的 PNG，保持不同设备上的字体和布局一致。SVG 保留矢量线条与文字，字体依次使用 Chalkboard、Kaiti SC 和 STKaiti；未安装对应字体的设备会使用后备字体。Excalidraw 文件保留可编辑图形、语义化元素名称和连接关系，可继续调整内容与布局。

配图采用手工编写的 Excalidraw 元素，通过本地 Rough.js 与 Sharp 离线导出。导出不依赖本地服务、浏览器或网络，已逐张检查文字、箭头与内容边界。插入正文的图片均附有描述性替代文本和图注。
