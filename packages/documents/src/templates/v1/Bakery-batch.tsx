import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

// Register fonts
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf', fontWeight: 300 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf', fontWeight: 500 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 },
  ],
});

const getStyles = (primaryColor = '#0f172a') => StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Roboto',
    backgroundColor: '#FFFFFF',
    color: '#1e293b',
  },
  // Header Styles
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: primaryColor,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerLeft: {
    flexDirection: 'column',
  },
  headerRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: primaryColor,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 2,
  },
  metaText: {
    fontSize: 8,
    color: '#64748b',
  },
  
  // Layout Helpers
  section: {
    marginBottom: 18,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  col: {
    flex: 1,
    marginRight: 10,
  },
  colLast: {
    flex: 1,
    marginRight: 0,
  },
  
  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 4,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Input Fields
  label: {
    fontSize: 7.5,
    color: '#475569',
    marginBottom: 4,
    fontWeight: 700,
    textTransform: 'uppercase',
  },
  inputBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 6,
    height: 24, // Fixed height for consistency
    justifyContent: 'center',
  },
  textAreaBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 6,
    height: 50,
  },
  
  // Checkboxes
  checkboxRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 2,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 6,
    width: '45%', // 2 columns for checkboxes
  },
  checkboxBox: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: '#64748b',
    marginRight: 6,
  },
  checkboxLabel: {
    fontSize: 9,
    color: '#334155',
  },

  // Helpers
  required: {
    color: '#ef4444',
  },
  
  // Footer & Signatures
  signatureSection: {
    marginTop: 30,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 15,
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  signatureBlock: {
    width: '30%',
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#94a3b8',
    height: 30,
    marginBottom: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 7,
    color: '#94a3b8',
  },
});

interface BatchProductionFormProps {
  batchId?: string | null;
  branding?: {
    primaryColor?: string;
  };
}

const BatchProductionForm: React.FC<BatchProductionFormProps> = ({ batchId, branding }) => {
  const styles = getStyles(branding?.primaryColor);
  const formId = batchId || `BATCH-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`;
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Production Run Sheet</Text>
            <Text style={styles.subtitle}>Manufacturing & Quality Control Record</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.metaText}>FORM ID: {formId}</Text>
            <Text style={styles.metaText}>DATE: {date}</Text>
          </View>
        </View>

        {/* Section 1: Recipe & Planning */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>1. Production Planning</Text>
          </View>
          
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Recipe Name</Text>
              <View style={styles.inputBox} />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Recipe ID <Text style={styles.required}>*</Text></Text>
              <View style={styles.inputBox} />
            </View>
            <View style={styles.colLast}>
               {/* Merged Unit Field */}
              <Text style={styles.label}>Unit / UoM <Text style={styles.required}>*</Text></Text>
              <View style={styles.inputBox} />
            </View>
          </View>

           {/* New Quantities Row */}
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Planned Quantity <Text style={styles.required}>*</Text></Text>
              <View style={styles.inputBox} />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Production Date</Text>
              <View style={styles.inputBox} />
            </View>
            <View style={styles.colLast}>
              <Text style={styles.label}>Output Location ID</Text>
              <View style={styles.inputBox} />
            </View>
          </View>
        </View>

        {/* Section 2: Production Results (Yield & Spoilage) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>2. Actual Yield & Quality Analysis</Text>
          </View>

          {/* High Visibility Metrics */}
          <View style={styles.row}>
            <View style={styles.col}>
               {/* Planned repeated for comparison context if needed, or just Actual */}
              <Text style={styles.label}>Actual Quantity (Good) <Text style={styles.required}>*</Text></Text>
              <View style={[styles.inputBox, { borderBottomWidth: 2 }]} />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Spoilt / Waste Quantity</Text>
              <View style={styles.inputBox} />
            </View>
            <View style={styles.colLast}>
              <Text style={styles.label}>Total Produced (Good + Spoilt)</Text>
              <View style={styles.inputBox} />
            </View>
          </View>

          {/* Spoilage Reason */}
          <View style={styles.row}>
            <View style={styles.colLast}>
              <Text style={styles.label}>Spoilage Reason / Quality Issues</Text>
              <View style={styles.textAreaBox}>
                <Text style={{ color: '#cbd5e1', fontSize: 8 }}>Describe why wastage occurred (e.g. burnt, contamination, dropped)...</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Section 3: Schedule & Personnel */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>3. Schedule & Personnel</Text>
          </View>
          
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Baker / Operator Name</Text>
              <View style={styles.inputBox} />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Start Time</Text>
              <View style={styles.inputBox} />
            </View>
            <View style={styles.colLast}>
              <Text style={styles.label}>End Time</Text>
              <View style={styles.inputBox} />
            </View>
          </View>
        </View>

        {/* Section 4: QC Checklist (Condensed) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>4. Quality Control Checks</Text>
          </View>
          <View style={styles.checkboxRow}>
             <View style={styles.checkboxItem}>
                <View style={styles.checkboxBox} />
                <Text style={styles.checkboxLabel}>Ingredients Verified</Text>
             </View>
             <View style={styles.checkboxItem}>
                <View style={styles.checkboxBox} />
                <Text style={styles.checkboxLabel}>Temperature Controls Met</Text>
             </View>
             <View style={styles.checkboxItem}>
                <View style={styles.checkboxBox} />
                <Text style={styles.checkboxLabel}>Equipment Sanitized</Text>
             </View>
             <View style={styles.checkboxItem}>
                <View style={styles.checkboxBox} />
                <Text style={styles.checkboxLabel}>Visual Inspection Passed</Text>
             </View>
             <View style={styles.checkboxItem}>
                <View style={styles.checkboxBox} />
                <Text style={styles.checkboxLabel}>Packaging Verified</Text>
             </View>
             <View style={styles.checkboxItem}>
                <View style={styles.checkboxBox} />
                <Text style={styles.checkboxLabel}>Labeling Accurate</Text>
             </View>
          </View>
        </View>

        {/* Section 5: Production Notes */}
        <View style={[styles.section, { flex: 1 }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>5. Production Notes</Text>
          </View>
          <View style={[styles.textAreaBox, { height: '100%', minHeight: 60 }]} />
        </View>

        {/* Signatures */}
        <View style={styles.signatureSection}>
           <View style={styles.signatureRow}>
              <View style={styles.signatureBlock}>
                 <Text style={styles.label}>Prepared By</Text>
                 <View style={styles.signatureLine} />
              </View>
              <View style={styles.signatureBlock}>
                 <Text style={styles.label}>Quality Checked By</Text>
                 <View style={styles.signatureLine} />
              </View>
              <View style={styles.signatureBlock}>
                 <Text style={styles.label}>Approved By</Text>
                 <View style={styles.signatureLine} />
              </View>
           </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Internal Document | {formId} | Page 1 of 1
          </Text>
        </View>

      </Page>
    </Document>
  );
};

export { BatchProductionForm };
