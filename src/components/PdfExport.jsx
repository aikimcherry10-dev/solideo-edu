import { useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

function formatBytes(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(Math.max(bytes, 1)) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function formatSpeed(bytesPerSec) {
    if (!bytesPerSec || bytesPerSec < 0) return '0 B/s';
    const k = 1024;
    const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    const i = Math.floor(Math.log(Math.max(bytesPerSec, 1)) / Math.log(k));
    return `${(bytesPerSec / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function PdfExport({ dashboardRef, getRecordedData, systemInfo, realtimeData, isRecording }) {
    const [isExporting, setIsExporting] = useState(false);

    const calculateStats = (data) => {
        if (!data || data.length === 0) return null;

        const stats = {
            cpu: { min: Infinity, max: -Infinity, avg: 0, values: [] },
            memory: { min: Infinity, max: -Infinity, avg: 0, values: [] },
            networkDown: { min: Infinity, max: -Infinity, avg: 0, total: 0 },
            networkUp: { min: Infinity, max: -Infinity, avg: 0, total: 0 }
        };

        data.forEach(d => {
            // CPU
            const cpuUsage = d?.cpu?.usage || 0;
            stats.cpu.min = Math.min(stats.cpu.min, cpuUsage);
            stats.cpu.max = Math.max(stats.cpu.max, cpuUsage);
            stats.cpu.values.push(cpuUsage);

            // Memory
            const memUsage = d?.memory?.usagePercent || 0;
            stats.memory.min = Math.min(stats.memory.min, memUsage);
            stats.memory.max = Math.max(stats.memory.max, memUsage);
            stats.memory.values.push(memUsage);

            // Network
            const netDown = d?.network?.download || 0;
            const netUp = d?.network?.upload || 0;
            stats.networkDown.min = Math.min(stats.networkDown.min, netDown);
            stats.networkDown.max = Math.max(stats.networkDown.max, netDown);
            stats.networkDown.total += netDown;
            stats.networkUp.min = Math.min(stats.networkUp.min, netUp);
            stats.networkUp.max = Math.max(stats.networkUp.max, netUp);
            stats.networkUp.total += netUp;
        });

        // Calculate averages
        stats.cpu.avg = stats.cpu.values.reduce((a, b) => a + b, 0) / stats.cpu.values.length;
        stats.memory.avg = stats.memory.values.reduce((a, b) => a + b, 0) / stats.memory.values.length;
        stats.networkDown.avg = stats.networkDown.total / data.length;
        stats.networkUp.avg = stats.networkUp.total / data.length;

        return stats;
    };

    const exportToPdf = async () => {
        setIsExporting(true);

        try {
            const recordedData = getRecordedData();
            const stats = calculateStats(recordedData);

            // Create PDF
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 15;
            let yPos = margin;

            // Title
            pdf.setFontSize(24);
            pdf.setTextColor(99, 102, 241);
            pdf.text('System Resource Report', pageWidth / 2, yPos, { align: 'center' });
            yPos += 12;

            // Subtitle
            pdf.setFontSize(10);
            pdf.setTextColor(100, 100, 120);
            const now = new Date();
            pdf.text(`Generated: ${now.toLocaleString('ko-KR')}`, pageWidth / 2, yPos, { align: 'center' });
            yPos += 5;
            pdf.text(`Recording Duration: ${recordedData.length} seconds`, pageWidth / 2, yPos, { align: 'center' });
            yPos += 15;

            // System Info Section
            pdf.setFontSize(14);
            pdf.setTextColor(60, 60, 80);
            pdf.text('System Information', margin, yPos);
            yPos += 8;

            pdf.setFontSize(10);
            pdf.setTextColor(80, 80, 100);

            const sysInfo = [
                ['OS', `${systemInfo?.os?.distro || 'N/A'} ${systemInfo?.os?.release || ''}`],
                ['CPU', `${systemInfo?.cpu?.manufacturer || ''} ${systemInfo?.cpu?.brand || 'N/A'}`],
                ['Cores', `${systemInfo?.cpu?.physicalCores || 'N/A'} Physical / ${systemInfo?.cpu?.cores || 'N/A'} Logical`],
                ['Memory', formatBytes(systemInfo?.memory?.total)]
            ];

            sysInfo.forEach(([label, value]) => {
                pdf.setFont(undefined, 'bold');
                pdf.text(`${label}: `, margin, yPos);
                pdf.setFont(undefined, 'normal');
                pdf.text(value, margin + 25, yPos);
                yPos += 6;
            });

            yPos += 10;

            // Resource Statistics Section
            if (stats) {
                pdf.setFontSize(14);
                pdf.setTextColor(60, 60, 80);
                pdf.text('Resource Statistics', margin, yPos);
                yPos += 10;

                // Table header
                const colWidths = [50, 35, 35, 35];
                const startX = margin;

                pdf.setFillColor(240, 240, 250);
                pdf.rect(startX, yPos - 5, colWidths.reduce((a, b) => a + b, 0), 8, 'F');

                pdf.setFontSize(10);
                pdf.setTextColor(60, 60, 80);
                pdf.setFont(undefined, 'bold');
                pdf.text('Resource', startX + 2, yPos);
                pdf.text('Min', startX + colWidths[0] + 2, yPos);
                pdf.text('Max', startX + colWidths[0] + colWidths[1] + 2, yPos);
                pdf.text('Average', startX + colWidths[0] + colWidths[1] + colWidths[2] + 2, yPos);
                yPos += 8;

                pdf.setFont(undefined, 'normal');

                // CPU Row
                pdf.text('CPU Usage', startX + 2, yPos);
                pdf.text(`${stats.cpu.min.toFixed(1)}%`, startX + colWidths[0] + 2, yPos);
                pdf.text(`${stats.cpu.max.toFixed(1)}%`, startX + colWidths[0] + colWidths[1] + 2, yPos);
                pdf.text(`${stats.cpu.avg.toFixed(1)}%`, startX + colWidths[0] + colWidths[1] + colWidths[2] + 2, yPos);
                yPos += 7;

                // Memory Row
                pdf.setFillColor(248, 248, 255);
                pdf.rect(startX, yPos - 5, colWidths.reduce((a, b) => a + b, 0), 7, 'F');
                pdf.text('Memory Usage', startX + 2, yPos);
                pdf.text(`${stats.memory.min.toFixed(1)}%`, startX + colWidths[0] + 2, yPos);
                pdf.text(`${stats.memory.max.toFixed(1)}%`, startX + colWidths[0] + colWidths[1] + 2, yPos);
                pdf.text(`${stats.memory.avg.toFixed(1)}%`, startX + colWidths[0] + colWidths[1] + colWidths[2] + 2, yPos);
                yPos += 7;

                // Network Download Row
                pdf.text('Network Download', startX + 2, yPos);
                pdf.text(formatSpeed(stats.networkDown.min), startX + colWidths[0] + 2, yPos);
                pdf.text(formatSpeed(stats.networkDown.max), startX + colWidths[0] + colWidths[1] + 2, yPos);
                pdf.text(formatSpeed(stats.networkDown.avg), startX + colWidths[0] + colWidths[1] + colWidths[2] + 2, yPos);
                yPos += 7;

                // Network Upload Row
                pdf.setFillColor(248, 248, 255);
                pdf.rect(startX, yPos - 5, colWidths.reduce((a, b) => a + b, 0), 7, 'F');
                pdf.text('Network Upload', startX + 2, yPos);
                pdf.text(formatSpeed(stats.networkUp.min), startX + colWidths[0] + 2, yPos);
                pdf.text(formatSpeed(stats.networkUp.max), startX + colWidths[0] + colWidths[1] + 2, yPos);
                pdf.text(formatSpeed(stats.networkUp.avg), startX + colWidths[0] + colWidths[1] + colWidths[2] + 2, yPos);
                yPos += 15;
            }

            // Capture dashboard screenshot
            if (dashboardRef.current) {
                const canvas = await html2canvas(dashboardRef.current, {
                    backgroundColor: '#0a0a0f',
                    scale: 1.5,
                    logging: false,
                    useCORS: true
                });

                const imgData = canvas.toDataURL('image/png');
                const imgWidth = pageWidth - (margin * 2);
                const imgHeight = (canvas.height * imgWidth) / canvas.width;

                // Check if we need a new page
                if (yPos + imgHeight > pageHeight - margin) {
                    pdf.addPage();
                    yPos = margin;
                }

                pdf.setFontSize(14);
                pdf.setTextColor(60, 60, 80);
                pdf.text('Dashboard Screenshot', margin, yPos);
                yPos += 8;

                // Add image, potentially split across pages
                if (yPos + imgHeight <= pageHeight - margin) {
                    // 이미지가 한 페이지에 들어감
                    pdf.addImage(imgData, 'PNG', margin, yPos, imgWidth, imgHeight);
                    yPos += imgHeight;
                } else {
                    // 이미지를 여러 페이지에 분할
                    const ctx = canvas.getContext('2d');
                    let currentCanvasY = 0;
                    const canvasWidth = canvas.width;
                    let remainingHeight = canvas.height;

                    while (remainingHeight > 0) {
                        const availableHeight = pageHeight - yPos - margin;
                        const canvasHeightToCapture = Math.min(
                            remainingHeight,
                            (availableHeight / imgHeight) * canvas.height
                        );

                        // 캔버스 일부를 새로운 캔버스에 복사
                        const partCanvas = document.createElement('canvas');
                        partCanvas.width = canvasWidth;
                        partCanvas.height = canvasHeightToCapture;

                        const partCtx = partCanvas.getContext('2d');
                        partCtx.drawImage(
                            canvas,
                            0, currentCanvasY,
                            canvasWidth, canvasHeightToCapture,
                            0, 0,
                            canvasWidth, canvasHeightToCapture
                        );

                        const partImgData = partCanvas.toDataURL('image/png');
                        const partImgHeight = (canvasHeightToCapture * imgWidth) / canvasWidth;

                        pdf.addImage(partImgData, 'PNG', margin, yPos, imgWidth, partImgHeight);

                        currentCanvasY += canvasHeightToCapture;
                        remainingHeight -= canvasHeightToCapture;

                        if (remainingHeight > 0) {
                            pdf.addPage();
                            yPos = margin;
                        }
                    }
                }
            }

            // Disk Information
            if (realtimeData?.disk && realtimeData.disk.length > 0) {
                pdf.addPage();
                yPos = margin;

                pdf.setFontSize(14);
                pdf.setTextColor(60, 60, 80);
                pdf.text('Disk Usage', margin, yPos);
                yPos += 10;

                pdf.setFontSize(10);
                realtimeData.disk.forEach((disk, i) => {
                    if (disk.mount === '/' || disk.mount.startsWith('/Volumes') || disk.mount === '/System/Volumes/Data') {
                        if (i > 0 && i % 2 === 0) {
                            pdf.setFillColor(248, 248, 255);
                            pdf.rect(margin, yPos - 5, pageWidth - margin * 2, 7, 'F');
                        }
                        pdf.text(`${disk.mount}: ${formatBytes(disk.used)} / ${formatBytes(disk.size)} (${disk.usagePercent?.toFixed(1)}%)`, margin, yPos);
                        yPos += 7;
                    }
                });
            }

            // Footer
            pdf.setFontSize(8);
            pdf.setTextColor(150, 150, 170);
            pdf.text('Generated by System Resource Monitor', pageWidth / 2, pageHeight - 10, { align: 'center' });

            // Save PDF
            const filename = `system-report-${now.toISOString().split('T')[0]}-${now.getHours()}${now.getMinutes()}.pdf`;
            pdf.save(filename);

        } catch (error) {
            console.error('PDF export error:', error);
            alert('PDF 생성 중 오류가 발생했습니다.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <button
            className="btn btn-secondary"
            onClick={exportToPdf}
            disabled={isExporting || isRecording}
        >
            {isExporting ? '📄 생성 중...' : '📄 PDF 저장'}
        </button>
    );
}

export default PdfExport;
