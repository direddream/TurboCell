# Turbo-Select (Concept Demo)

“智能选型与边界评估系统 (Turbo-Select)”的概念验证 Demo。

- **Scenario-to-Cell**：输入工况/约束 → 推荐电芯 + 串并建议 + 风险标签 + 解释性指标
- **Cell-to-Scenario**：选择电芯 → 输出 SOA（Safe Operating Area）热力图 + SOC 建议区间 + 限流策略示例

注意：本 Demo 的计算是 **可解释的启发式规则 + 轻量近似模型**，用于“看上去像那么回事”的产品概念展示，不代表真实电化学仿真结论。

## Run

```bash
npm install
npm run dev
```

## Project layout

- `src/demo/cells.ts`：演示用电芯数据库（结构化字段 + 置信度标识）
- `src/lib/matching.ts`：Scenario-to-Cell 的过滤/评分/解释逻辑（启发式）
- `src/lib/soa.ts`：Cell-to-Scenario 的 SOA 生成逻辑（启发式）
