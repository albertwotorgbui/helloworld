$notebookPath = "C:\Users\rd5647dvla\Documents\Projects\Nairobi Workshop\Lab0_Big_Data_SQL_and_ETL_Basics.ipynb"
$htmlPath = "C:\Users\rd5647dvla\Documents\Projects\helloworld\notebook.html"
$pdfPath = "C:\Users\rd5647dvla\Documents\Projects\helloworld\notebook.pdf"
$targetPdfPath = "C:\Users\rd5647dvla\Documents\Projects\Nairobi Workshop\Lab0_Big_Data_SQL_and_ETL_Basics.pdf"

$nb = Get-Content -Raw $notebookPath | ConvertFrom-Json

# Construct HTML pieces using simple string concatenation
$html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Lab 0: Fundamentals of Big Data, SQL & ETL</title>'
$html += '<style>'
$html += '@import url("https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Fira+Code:wght@400;500&display=swap");'
$html += '@page { size: A4; margin: 20mm; }'
$html += 'body { font-family: "Plus Jakarta Sans", sans-serif; color: #1e293b; line-height: 1.6; font-size: 10pt; margin: 0; padding: 0; }'
$html += 'h1, h2, h3, h4 { font-family: "Outfit", sans-serif; color: #0f172a; margin-top: 1.5em; margin-bottom: 0.5em; }'
$html += 'h1 { font-size: 24pt; border-bottom: 2px solid #f59e0b; padding-bottom: 8px; margin-top: 0; }'
$html += 'h2 { font-size: 16pt; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; color: #047857; }'
$html += 'h3 { font-size: 12pt; color: #0f172a; }'
$html += 'p { margin-top: 0; margin-bottom: 1em; }'
$html += 'table { width: 100%; border-collapse: collapse; margin-top: 1em; margin-bottom: 1.5em; font-size: 9pt; }'
$html += 'th, td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; }'
$html += 'th { background-color: #f8fafc; font-weight: 600; }'
$html += '.cell { margin-bottom: 24px; page-break-inside: avoid; }'
$html += '.code-cell { border: 1px solid #e2e8f0; border-radius: 6px; background-color: #f8fafc; padding: 12px; margin-bottom: 24px; }'
$html += '.input-area { display: flex; margin-bottom: 8px; }'
$html += '.execution-count { font-family: "Fira Code", monospace; font-size: 8.5pt; color: #64748b; width: 65px; text-align: right; padding-right: 12px; user-select: none; }'
$html += '.code-block { font-family: "Fira Code", monospace; font-size: 8.5pt; color: #0f172a; white-space: pre-wrap; margin: 0; flex-grow: 1; }'
$html += '.output-area { border-top: 1px dashed #cbd5e1; padding-top: 8px; margin-top: 8px; }'
$html += '.output-stream { font-family: "Fira Code", monospace; font-size: 8pt; color: #334155; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 4px; padding: 8px 12px; white-space: pre-wrap; margin: 0; }'
$html += 'code { font-family: "Fira Code", monospace; background-color: #f1f5f9; padding: 1px 4px; border-radius: 3px; font-size: 8.5pt; }'
$html += '.markdown-cell p { margin-bottom: 0.8em; }'
$html += '.markdown-cell blockquote { border-left: 4px solid #cbd5e1; padding-left: 12px; margin-left: 0; color: #475569; }'
$html += '.header-meta { font-size: 9pt; color: #64748b; margin-bottom: 2em; display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }'
$html += '.footer { margin-top: 3em; font-size: 8.5pt; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px; }'
$html += '</style></head><body>'
$html += '<h1>🎓 Lab 0: Fundamentals of Big Data, SQL & ETL</h1>'
$html += '<div class="header-meta"><span>Prepared for: Albert Wotorgbui (Deputy Director, DVLA Ghana)</span><span>Format: Exported Interactive Jupyter Lab Notebook</span></div>'

function Convert-MarkdownToHtml($lines) {
    $text = $lines -join ""
    
    # Escape HTML special chars
    $text = $text.Replace("&", "&amp;").Replace("<", "&lt;").Replace(">", "&gt;")
    
    # Process markdown headings
    $text = [regex]::Replace($text, "(?m)^### (.*)$", "<h3>`$1</h3>")
    $text = [regex]::Replace($text, "(?m)^## (.*)$", "<h2>`$1</h2>")
    $text = [regex]::Replace($text, "(?m)^# (.*)$", "<h1>`$1</h1>")
    
    # Process bold text
    $text = [regex]::Replace($text, "\*\*(.*?)\*\*", "<strong>`$1</strong>")
    
    # Process code backticks
    $text = [regex]::Replace($text, '`([^`]+)`', '<code>$1</code>')

    # Replace newlines with paragraph tags
    $paragraphs = $text -split "\n\n"
    $htmlParas = @()
    foreach ($p in $paragraphs) {
        if ($p.Trim() -ne "") {
            # Check if this paragraph contains a table
            if ($p -like "*|*|*") {
                # Format tables
                $rows = $p -split "\n"
                $tableHtml = "<table>"
                $isHeader = $true
                foreach ($row in $rows) {
                    if ($row.Trim() -eq "" -or $row -like "*|---|*") { continue }
                    $cols = $row.Split("|") | Where-Object { $_ -ne "" }
                    $tableHtml += "<tr>"
                    foreach ($col in $cols) {
                        $colText = $col.Trim()
                        if ($isHeader) {
                            $tableHtml += "<th>$colText</th>"
                        } else {
                            $tableHtml += "<td>$colText</td>"
                        }
                    }
                    $tableHtml += "</tr>"
                    $isHeader = $false
                }
                $tableHtml += "</table>"
                $htmlParas += $tableHtml
            } elseif ($p.StartsWith("<h3>") -or $p.StartsWith("<h2>") -or $p.StartsWith("<h1>")) {
                # Already wrapped in header
                $htmlParas += $p.Replace("`n", "<br>")
            } else {
                $htmlParas += "<p>" + $p.Replace("`n", "<br>") + "</p>"
            }
        }
    }
    
    return "<div class='markdown-cell'>" + ($htmlParas -join "") + "</div>"
}

# Iterate through cells
foreach ($cell in $nb.cells) {
    if ($cell.cell_type -eq "markdown") {
        $cellHtml = Convert-MarkdownToHtml $cell.source
        $html += "<div class='cell'>$cellHtml</div>"
    } elseif ($cell.cell_type -eq "code") {
        $execCount = if ($cell.execution_count) { $cell.execution_count } else { " " }
        $codeText = ($cell.source -join "")
        $codeTextEscaped = $codeText.Replace("&", "&amp;").Replace("<", "&lt;").Replace(">", "&gt;")
        
        $html += "<div class='cell code-cell'>"
        $html += "  <div class='input-area'>"
        $html += "    <div class='execution-count'>In [$execCount]:</div>"
        $html += "    <pre class='code-block'><code>$codeTextEscaped</code></pre>"
        $html += "  </div>"
        
        # Check if outputs exist
        if ($cell.outputs -and $cell.outputs.Count -gt 0) {
            $html += "  <div class='output-area'>"
            foreach ($out in $cell.outputs) {
                if ($out.output_type -eq "stream") {
                    $streamText = ($out.text -join "")
                    # Clean ANSI colors
                    $streamText = [regex]::Replace($streamText, "\x1B\[\d+(;\d+)*m", "")
                    $streamText = $streamText.Replace("&", "&amp;").Replace("<", "&lt;").Replace(">", "&gt;")
                    $html += "    <pre class='output-stream'>$streamText</pre>"
                } elseif ($out.output_type -eq "execute_result" -or $out.output_type -eq "display_data") {
                    $plainText = ($out.data.'text/plain' -join "")
                    $plainText = [regex]::Replace($plainText, "\x1B\[\d+(;\d+)*m", "")
                    $plainText = $plainText.Replace("&", "&amp;").Replace("<", "&lt;").Replace(">", "&gt;")
                    $html += "    <pre class='output-stream'>$plainText</pre>"
                }
            }
            $html += "  </div>"
        }
        $html += "</div>"
    }
}

$html += '<div class="footer">© 2026 DVLA Ghana Big Data & Analytics Division. Nairobi Workshop Training Resource.</div></body></html>'

$html | Set-Content -Path $htmlPath

# Print to PDF using Chrome headless
Start-Process -FilePath "C:\Program Files\Google\Chrome\Application\chrome.exe" -ArgumentList "--headless=new", "--disable-gpu", "--no-sandbox", "--print-to-pdf=$pdfPath", $htmlPath -NoNewWindow -Wait

if (Test-Path $pdfPath) {
    Copy-Item -Path $pdfPath -Destination $targetPdfPath -Force
    Remove-Item -Path $pdfPath
    Remove-Item -Path $htmlPath
    Write-Output "SUCCESS: PDF generated and copied to target path."
} else {
    Write-Output "ERROR: PDF print failed."
}
