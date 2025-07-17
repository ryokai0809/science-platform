from datetime import datetime, timedelta
from weasyprint import HTML

# ここが HTML雛形（★）
invoice_template = """
<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<style>
body { font-family: sans-serif; line-height: 1.8; }
h1 { text-align: center; }
table { width: 100%%; border-collapse: collapse; }
td, th { border: 1px solid #ccc; padding: 8px; }
</style>
</head>
<body>
<h1>請求書</h1>
<p>発行日: {issue_date}</p>
<p>請求先: {customer_name} 様</p>

<p>当月（{billing_month}）の登録学生数に基づき、以下の通りご請求申し上げます。</p>

<table>
<tr><th>学生数</th><th>単価</th><th>還元率</th><th>合計</th></tr>
<tr>
<td>{student_count}名</td>
<td>¥{unit_price:,}</td>
<td>{refund_rate:.0%}</td>
<td>¥{total_amount:,}</td>
</tr>
</table>

<p>お支払期限: {due_date}</p>
<p>振込先: みずほ銀行 ◯◯支店 普通 1234567 サイエンスドリーム</p>

<hr>
<p>お問い合わせ: support@example.com</p>
</body>
</html>
"""

def generate_invoice(student_count, unit_price, refund_rate, customer_name, output_path):
    today = datetime.today()
    issue_date = today.strftime("%Y年%m月%d日")
    billing_month = today.strftime("%Y年%m月")
    due_date = (today.replace(day=1) + timedelta(days=40)).strftime("%Y年%m月%d日")
    total_amount = int(student_count * unit_price * refund_rate)

    html_content = invoice_template.format(
        issue_date=issue_date,
        billing_month=billing_month,
        customer_name=customer_name,
        student_count=student_count,
        unit_price=unit_price,
        refund_rate=refund_rate,
        total_amount=total_amount,
        due_date=due_date
    )

    HTML(string=html_content).write_pdf(output_path)
    print(f"✅ 請求書を生成しました: {output_path}")


# 実行例
generate_invoice(
    student_count=35,
    unit_price=1000,
    refund_rate=0.3,
    customer_name="◯◯塾",
    output_path="invoice_202507_◯◯塾.pdf"
)
