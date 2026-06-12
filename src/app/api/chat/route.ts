import { NextResponse } from "next/server"
import { all, one } from "@/server/db"

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY || ""
const DASHSCOPE_API_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"

const SYSTEM_PROMPT = `你是智慧盐湖数据管理平台的AI助手。你可以帮助用户查询和分析采卤井数据。

数据库表结构：
- WellLineInfo: 采卤线 (id, name, shortName, region, regionSeq)
- WellInfo: 采卤井 (wellId, lineId, completionDate, technology, wellSize, initialWaterLevel, designDepth)
- DynamicMonitoring: 动态监测 (id, wellId, collectDate, staticWater, dynamicWater, wellDepth, flowRate, pumpDepth, pumpFlow, motorPower, manufacturer, status)
- LabData: 化验数据 (id, wellId, testDate, viscosity, density, ph, salinity, kPlus, mg2Plus, clMinus, so42Minus, ca2Plus, b2o3, liPlus, naPlus)

区域: N=北部, C=中部, W=西部, E=东部, S=南部
运行状态: normal=正常, abnormal=异常, stopped=停止, abandoned=废弃

请根据用户的问题生成SQL查询语句。只返回JSON格式：
{"sql": "SQL查询语句", "description": "查询说明"}

如果问题无法通过SQL回答，请返回：
{"error": "无法回答的原因"}

注意：
1. 使用SQLite语法
2. 只读查询，不要修改数据
3. 查询结果限制在100条以内
4. 对于日期过滤，使用strftime('%Y-%m', dateColumn)格式`

async function queryDB(sql: string) {
  try {
    const stmt = all(sql)
    return { success: true, data: stmt }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

async function callTongyiQianwen(messages: any[]) {
  if (!DASHSCOPE_API_KEY) {
    return { error: "未配置 DASHSCOPE_API_KEY 环境变量" }
  }

  try {
    const res = await fetch(DASHSCOPE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DASHSCOPE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "qwen-turbo",
        messages,
        temperature: 0.1,
        max_tokens: 1000,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return { error: `API调用失败: ${res.status} ${err}` }
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content || ""
    return { content }
  } catch (e: any) {
    return { error: `网络错误: ${e.message}` }
  }
}

export async function POST(req: Request) {
  try {
    const { message, history = [] } = await req.json()

    if (!message) {
      return NextResponse.json({ error: "请输入问题" }, { status: 400 })
    }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.slice(-6),
      { role: "user", content: message },
    ]

    const aiResponse = await callTongyiQianwen(messages)

    if (aiResponse.error) {
      return NextResponse.json({ error: aiResponse.error })
    }

    const content = aiResponse.content || ""

    let sqlMatch = content.match(/```json\s*([\s\S]*?)```/) || content.match(/\{[\s\S]*"sql"[\s\S]*\}/)
    let sql = ""
    let description = ""

    if (sqlMatch) {
      try {
        const jsonStr = sqlMatch[1] || sqlMatch[0]
        const parsed = JSON.parse(jsonStr)
        sql = parsed.sql || ""
        description = parsed.description || ""
      } catch {
        // Try direct JSON parse if regex didn't capture properly
        try {
          const parsed = JSON.parse(content)
          sql = parsed.sql || ""
          description = parsed.description || ""
        } catch {
          sql = ""
        }
      }
    }

    if (!sql) {
      return NextResponse.json({
        answer: content,
        sql: null,
        data: null,
        description: null,
      })
    }

    const dbResult = await queryDB(sql)

    if (!dbResult.success) {
      return NextResponse.json({
        answer: `查询执行出错：${dbResult.error}`,
        sql,
        data: null,
        description,
      })
    }

    const data = dbResult.data || []
    let answer = ""

    if (data.length === 0) {
      answer = description || "查询结果为空，没有找到匹配的数据。"
    } else if (data.length === 1 && Object.keys(data[0]).length === 1) {
      const val = Object.values(data[0])[0]
      answer = `${description || '查询结果'}：${val}`
    } else {
      answer = description || `查询到 ${data.length} 条记录`
    }

    return NextResponse.json({
      answer,
      sql,
      data: data.slice(0, 50),
      description,
      total: data.length,
    })
  } catch (e: any) {
    return NextResponse.json({ error: "服务器错误: " + e.message }, { status: 500 })
  }
}
