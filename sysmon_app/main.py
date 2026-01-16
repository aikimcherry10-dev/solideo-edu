import asyncio
import time
from datetime import datetime
from typing import List, Dict
import psutil
from fastapi import FastAPI, WebSocket, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.graphics.shapes import Drawing, Line
from reportlab.graphics.charts.linecharts import HorizontalLineChart

app = FastAPI()

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# State
recording_state = {
    "is_recording": False,
    "start_time": None,
    "data": [],
    "duration": 5 * 60  # 5 minutes
}

def get_top_processes():
    """Retrieves top 5 processes by CPU and Memory usage."""
    processes = []
    try:
        # Fetch all running processes with minimal attributes
        for p in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
            try:
                # Calculate explicit memory percent if needed, but p.memory_percent() is good enough usually.
                # However, consistent with our "App Memory" logic, users prefer standard metrics.
                processes.append(p.info)
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                pass
    except Exception:
        return {"cpu": [], "memory": []}

    # Sort by CPU
    top_cpu = sorted(processes, key=lambda p: p['cpu_percent'] or 0, reverse=True)[:5]
    
    # Sort by Memory
    top_mem = sorted(processes, key=lambda p: p['memory_percent'] or 0, reverse=True)[:5]
    
    return {"cpu": top_cpu, "memory": top_mem}

def get_system_stats():
    """Collects current system resources."""
    net = psutil.net_io_counters()
    disk = psutil.disk_usage('/')
    
    mem = psutil.virtual_memory()
    
    # [Mac OS Optimization]
    if hasattr(mem, 'active'):
        memory_usage = (mem.active / mem.total) * 100
    else:
        memory_usage = (mem.total - mem.available) / mem.total * 100
    
    top_procs = get_top_processes()

    return {
        "timestamp": time.time(),
        "cpu": psutil.cpu_percent(interval=None),
        "memory": memory_usage,
        "disk": disk.percent,
        "net_sent": net.bytes_sent,
        "net_recv": net.bytes_recv,
        "top_cpu": top_procs['cpu'],
        "top_mem": top_procs['memory']
    }

def generate_pdf_report(data: List[Dict], filepath: str):
    """Generates a PDF report from the recorded data."""
    doc = SimpleDocTemplate(filepath, pagesize=A4)
    story = []
    styles = getSampleStyleSheet()
    
    # Title
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=24, spaceAfter=20, alignment=1)
    story.append(Paragraph("System Resource Monitoring Report", title_style))
    story.append(Paragraph(f"Generated at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
    story.append(Spacer(1, 20))
    
    if not data:
        story.append(Paragraph("No data recorded.", styles['Normal']))
        doc.build(story)
        return

    # 1. Summary Statistics
    story.append(Paragraph("1. Summary Statistics", styles['Heading2']))
    
    cpu_vals = [d['cpu'] for d in data]
    mem_vals = [d['memory'] for d in data]
    
    avg_cpu = sum(cpu_vals) / len(cpu_vals)
    max_cpu = max(cpu_vals)
    avg_mem = sum(mem_vals) / len(mem_vals)
    max_mem = max(mem_vals)
    
    # Calculate Network Usage (Total Delta)
    # Since net stats are cumulative, we take last - first
    first_net = data[0]
    last_net = data[-1]
    total_sent_mb = (last_net['net_sent'] - first_net['net_sent']) / (1024 * 1024)
    total_recv_mb = (last_net['net_recv'] - first_net['net_recv']) / (1024 * 1024)

    summary_data = [
        ["Metric", "Average", "Maximum", "Total Change"],
        ["CPU Usage", f"{avg_cpu:.1f}%", f"{max_cpu:.1f}%", "-"],
        ["Memory Usage", f"{avg_mem:.1f}%", f"{max_mem:.1f}%", "-"],
        ["Network Sent", "-", "-", f"{total_sent_mb:.2f} MB"],
        ["Network Recv", "-", "-", f"{total_recv_mb:.2f} MB"],
    ]
    
    t = Table(summary_data, colWidths=[150, 100, 100, 100])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    story.append(t)
    story.append(Spacer(1, 40))

    # 2. Charts
    story.append(Paragraph("2. CPU & Memory Usage Trend", styles['Heading2']))
    
    # Prepare data for chart (Downsample if too many points)
    # ReportLab charts are slow with too many points. Limit to ~50 points.
    step = max(1, len(data) // 50)
    sampled_data = data[::step]
    
    drawing = Drawing(400, 200)
    lc = HorizontalLineChart()
    lc.x = 50
    lc.y = 50
    lc.height = 125
    lc.width = 300
    lc.data = [
        [d['cpu'] for d in sampled_data],
        [d['memory'] for d in sampled_data]
    ]
    lc.lines[0].strokeColor = colors.red
    lc.lines[1].strokeColor = colors.blue
    lc.valueAxis.valueMin = 0
    lc.valueAxis.valueMax = 100
    lc.categoryAxis.labels.boxAnchor = 'n'
    # Simple labels for x axis (just indices for now to keep it clean)
    lc.categoryAxis.visible = False 
    
    drawing.add(lc)
    
    # Legend
    story.append(drawing)
    story.append(Paragraph("<font color='red'>Red: CPU %</font>, <font color='blue'>Blue: Memory %</font>", styles['Normal']))
    
    doc.build(story)

@app.get("/")
async def get():
    return FileResponse('static/index.html')

@app.get("/stats")
async def get_stats():
    stats = get_system_stats()
    # Handle recording state logic (simplified for polling)
    if recording_state["is_recording"]:
        recording_state["data"].append(stats)
        elapsed = time.time() - recording_state["start_time"]
        stats["recording_progress"] = min(100, (elapsed / recording_state["duration"]) * 100)
        if elapsed >= recording_state["duration"]:
                recording_state["is_recording"] = False
                generate_pdf_report(recording_state["data"], "report.pdf") # Fixed path to match download endpoint
                stats["recording_finished"] = True
    else:
        stats["recording_progress"] = 0
    return stats

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Re-use the polling logic or function if possible, but for now just copy paste to be safe
            stats = get_system_stats()
            
            # Recording Logic (Duplicated slightly but safer for concurrency if we stick to single thread)
            # Warning: mixing polling and WS for recording might duplicate data if user opens multiple tabs.
            # But for single user local app, it is fine.
            if recording_state["is_recording"]:
                 # Check if the last data point timestamp is significantly different to avoid double counting if multiple clients?
                 # For simplicity, let's assume single client for now.
                 if not recording_state["data"] or (stats["timestamp"] - recording_state["data"][-1]["timestamp"] > 0.5):
                    recording_state["data"].append(stats)
                
                 elapsed = time.time() - recording_state["start_time"]
                 stats["recording_progress"] = min(100, (elapsed / recording_state["duration"]) * 100)
                 
                 # Auto-stop
                 if elapsed >= recording_state["duration"]:
                      recording_state["is_recording"] = False
                      generate_pdf_report(recording_state["data"], "report.pdf")
                      stats["recording_finished"] = True
            else:
                 stats["recording_progress"] = 0
            
            await websocket.send_json(stats)
            await asyncio.sleep(1)
    except Exception as e:
        print(f"WS Error: {e}")

@app.post("/start-recording")
async def start_recording():
    recording_state["is_recording"] = True
    recording_state["start_time"] = time.time()
    recording_state["data"] = []
    return {"status": "started"}

@app.get("/download-report")
async def download_report():
    # If currently recording, stop and generate
    if recording_state["is_recording"]:
         recording_state["is_recording"] = False
         generate_pdf_report(recording_state["data"], "report.pdf")
         
    # If no report exists (and no data), careful
    try:
        # Regenerate to be sure if we have data
        if recording_state["data"]:
             generate_pdf_report(recording_state["data"], "report.pdf")
        return FileResponse("report.pdf", filename="system_report.pdf")
    except Exception:
        return {"error": "No report available"}
