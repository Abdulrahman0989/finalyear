class DataExporter {
    static async exportToCSV(data, filename) {
        const csvContent = this.convertToCSV(data);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    static convertToCSV(data) {
        const headers = Object.keys(data[0]);
        const rows = data.map(item => 
            headers.map(header => 
                JSON.stringify(item[header] || '')
            ).join(',')
        );
        return [
            headers.join(','),
            ...rows
        ].join('\n');
    }

    static async exportToPDF(elementId, filename) {
        const element = document.getElementById(elementId);
        const canvas = await html2canvas(element);
        const pdf = new jsPDF();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0);
        pdf.save(filename);
    }
} 