import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface DobDatePickerModalProps {
  visible: boolean;
  value: string; // 'YYYY-MM-DD'
  onSelect: (dateString: string) => void;
  onClose: () => void;
}

const MONTHS = [
  { num: '01', name: 'Jan', full: 'January' },
  { num: '02', name: 'Feb', full: 'February' },
  { num: '03', name: 'Mar', full: 'March' },
  { num: '04', name: 'Apr', full: 'April' },
  { num: '05', name: 'May', full: 'May' },
  { num: '06', name: 'Jun', full: 'June' },
  { num: '07', name: 'Jul', full: 'July' },
  { num: '08', name: 'Aug', full: 'August' },
  { num: '09', name: 'Sep', full: 'September' },
  { num: '10', name: 'Oct', full: 'October' },
  { num: '11', name: 'Nov', full: 'November' },
  { num: '12', name: 'Dec', full: 'December' }
];

const DECADES = [
  { label: '2010s', startYear: 2010, endYear: 2019 },
  { label: '2000s', startYear: 2000, endYear: 2009 },
  { label: '1990s', startYear: 1990, endYear: 1999 },
  { label: '1980s', startYear: 1980, endYear: 1989 },
  { label: '1970s', startYear: 1970, endYear: 1979 },
  { label: '1960s', startYear: 1960, endYear: 1969 },
  { label: '1950s', startYear: 1950, endYear: 1959 }
];

export const DobDatePickerModal: React.FC<DobDatePickerModalProps> = ({
  visible,
  value,
  onSelect,
  onClose
}) => {
  // Parse existing value or default to 1998-05-14
  const parsed = useMemo(() => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-');
      return { year: parseInt(y, 10), month: m, day: parseInt(d, 10) };
    }
    return { year: 1998, month: '05', day: 14 };
  }, [value]);

  const [selectedYear, setSelectedYear] = useState<number>(parsed.year);
  const [selectedMonth, setSelectedMonth] = useState<string>(parsed.month);
  const [selectedDay, setSelectedDay] = useState<number>(parsed.day);
  const [activeTab, setActiveTab] = useState<'year' | 'month' | 'day'>('year');
  const [selectedDecade, setSelectedDecade] = useState<string>('1990s');

  useEffect(() => {
    if (visible) {
      setSelectedYear(parsed.year);
      setSelectedMonth(parsed.month);
      setSelectedDay(parsed.day);
      setActiveTab('year');

      const decade = DECADES.find(
        (d) => parsed.year >= d.startYear && parsed.year <= d.endYear
      );
      if (decade) {
        setSelectedDecade(decade.label);
      }
    }
  }, [visible, parsed]);

  // Calculate days in selected month & year (handles leap years)
  const daysInMonth = useMemo(() => {
    const monthIndex = parseInt(selectedMonth, 10);
    return new Date(selectedYear, monthIndex, 0).getDate();
  }, [selectedYear, selectedMonth]);

  // Adjust day if selectedDay exceeds new month's max days
  useEffect(() => {
    if (selectedDay > daysInMonth) {
      setSelectedDay(daysInMonth);
    }
  }, [daysInMonth, selectedDay]);

  // Generate years list for the selected decade
  const yearsInDecade = useMemo(() => {
    const decade = DECADES.find((d) => d.label === selectedDecade);
    if (!decade) return [];
    const list: number[] = [];
    const currentYear = new Date().getFullYear();
    for (let y = decade.startYear; y <= Math.min(decade.endYear, currentYear); y++) {
      list.push(y);
    }
    return list;
  }, [selectedDecade]);

  // Calculated Age
  const calculatedAge = useMemo(() => {
    const today = new Date();
    const monthNum = parseInt(selectedMonth, 10) - 1;
    let age = today.getFullYear() - selectedYear;
    const monthDiff = today.getMonth() - monthNum;
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < selectedDay)) {
      age--;
    }
    return age >= 0 ? age : 0;
  }, [selectedYear, selectedMonth, selectedDay]);

  const formattedDate = useMemo(() => {
    const y = String(selectedYear);
    const m = selectedMonth.padStart(2, '0');
    const d = String(selectedDay).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [selectedYear, selectedMonth, selectedDay]);

  const monthName = useMemo(() => {
    const found = MONTHS.find((m) => m.num === selectedMonth);
    return found ? found.name : 'May';
  }, [selectedMonth]);

  const handleApply = () => {
    onSelect(formattedDate);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Top Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.eyebrow}>DATE OF BIRTH SELECTOR</Text>
              <Text style={styles.title}>Select Patient DOB</Text>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Close date selector"
              onPress={onClose}
              style={styles.closeBtn}
            >
              <Feather name="x" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Live Preview Card */}
          <View style={styles.previewCard}>
            <View style={styles.previewDateRow}>
              <View style={styles.calendarIconCircle}>
                <Ionicons name="calendar-outline" size={22} color={colors.brandBlue} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.previewDateText}>
                  {monthName} {selectedDay}, {selectedYear}
                </Text>
                <Text style={styles.previewFormatText}>{formattedDate}</Text>
              </View>
              <View style={styles.agePill}>
                <Text style={styles.agePillText}>
                  {calculatedAge} yrs ({calculatedAge >= 18 ? 'Adult' : 'Pediatric'})
                </Text>
              </View>
            </View>
          </View>

          {/* 3 Step Navigation Pills */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              accessibilityRole="tab"
              accessibilityLabel={`Select Year: ${selectedYear}`}
              accessibilityState={{ selected: activeTab === 'year' }}
              style={[styles.tabPill, activeTab === 'year' && styles.tabPillActive]}
              onPress={() => setActiveTab('year')}
            >
              <Text style={[styles.tabLabel, activeTab === 'year' && styles.tabLabelActive]}>
                Year: {selectedYear}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="tab"
              accessibilityLabel={`Select Month: ${monthName}`}
              accessibilityState={{ selected: activeTab === 'month' }}
              style={[styles.tabPill, activeTab === 'month' && styles.tabPillActive]}
              onPress={() => setActiveTab('month')}
            >
              <Text style={[styles.tabLabel, activeTab === 'month' && styles.tabLabelActive]}>
                Month: {monthName}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="tab"
              accessibilityLabel={`Select Day: ${selectedDay}`}
              accessibilityState={{ selected: activeTab === 'day' }}
              style={[styles.tabPill, activeTab === 'day' && styles.tabPillActive]}
              onPress={() => setActiveTab('day')}
            >
              <Text style={[styles.tabLabel, activeTab === 'day' && styles.tabLabelActive]}>
                Day: {selectedDay}
              </Text>
            </TouchableOpacity>
          </View>

          {/* TAB 1: Year Selector */}
          {activeTab === 'year' && (
            <View style={styles.tabContentArea}>
              <Text style={styles.sectionSubtitle}>1. Choose Decade:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.decadeRow}>
                {DECADES.map((d) => (
                  <TouchableOpacity
                    key={d.label}
                    accessibilityRole="button"
                    accessibilityLabel={`Decade ${d.label}`}
                    style={[
                      styles.decadeChip,
                      selectedDecade === d.label && styles.decadeChipActive
                    ]}
                    onPress={() => setSelectedDecade(d.label)}
                  >
                    <Text
                      style={[
                        styles.decadeChipText,
                        selectedDecade === d.label && styles.decadeChipTextActive
                      ]}
                    >
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[styles.sectionSubtitle, { marginTop: 14 }]}>2. Select Year:</Text>
              <View style={styles.yearsGrid}>
                {yearsInDecade.map((yr) => {
                  const isSelected = selectedYear === yr;
                  return (
                    <TouchableOpacity
                      key={yr}
                      accessibilityRole="button"
                      accessibilityLabel={`Year ${yr}`}
                      style={[styles.yearChip, isSelected && styles.yearChipActive]}
                      onPress={() => {
                        setSelectedYear(yr);
                        setActiveTab('month'); // Auto advance to month
                      }}
                    >
                      <Text style={[styles.yearChipText, isSelected && styles.yearChipTextActive]}>
                        {yr}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* TAB 2: Month Selector */}
          {activeTab === 'month' && (
            <View style={styles.tabContentArea}>
              <Text style={styles.sectionSubtitle}>Choose Birth Month:</Text>
              <View style={styles.monthsGrid}>
                {MONTHS.map((m) => {
                  const isSelected = selectedMonth === m.num;
                  return (
                    <TouchableOpacity
                      key={m.num}
                      accessibilityRole="button"
                      accessibilityLabel={m.full}
                      style={[styles.monthTile, isSelected && styles.monthTileActive]}
                      onPress={() => {
                        setSelectedMonth(m.num);
                        setActiveTab('day'); // Auto advance to day
                      }}
                    >
                      <Text style={[styles.monthNumText, isSelected && styles.monthNumTextActive]}>
                        {m.num}
                      </Text>
                      <Text style={[styles.monthNameText, isSelected && styles.monthNameTextActive]}>
                        {m.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* TAB 3: Day Selector */}
          {activeTab === 'day' && (
            <View style={styles.tabContentArea}>
              <Text style={styles.sectionSubtitle}>
                Choose Day of Month (1 – {daysInMonth}):
              </Text>
              <ScrollView style={styles.daysScrollView} contentContainerStyle={styles.daysGrid}>
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
                  const isSelected = selectedDay === d;
                  return (
                    <TouchableOpacity
                      key={d}
                      accessibilityRole="button"
                      accessibilityLabel={`Day ${d}`}
                      style={[styles.dayTile, isSelected && styles.dayTileActive]}
                      onPress={() => setSelectedDay(d)}
                    >
                      <Text style={[styles.dayTileText, isSelected && styles.dayTileTextActive]}>
                        {d}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Bottom Action Buttons */}
          <View style={styles.modalActionRow}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Cancel date selection"
              style={styles.cancelBtn}
              onPress={onClose}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`Confirm date ${formattedDate}`}
              style={styles.applyBtn}
              onPress={handleApply}
            >
              <Feather name="check" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.applyBtnText}>Apply Date</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 37, 64, 0.55)',
    justifyContent: 'flex-end'
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '85%'
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
    textTransform: 'uppercase'
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0A2540',
    letterSpacing: -0.4,
    marginTop: 2
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center'
  },

  // Preview Card
  previewCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
    borderRadius: 18,
    padding: 14,
    marginBottom: 16
  },
  previewDateRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  calendarIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  previewDateText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0A2540'
  },
  previewFormatText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.brandBlue,
    marginTop: 2
  },
  agePill: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  agePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#166534'
  },

  // Tabs Row
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14
  },
  tabPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center'
  },
  tabPillActive: {
    backgroundColor: colors.brandBlue,
    borderColor: colors.brandBlue
  },
  tabLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569'
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontWeight: '800'
  },

  // Content Area
  tabContentArea: {
    minHeight: 220
  },
  sectionSubtitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8
  },

  // Decades
  decadeRow: {
    gap: 8,
    paddingVertical: 2
  },
  decadeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0'
  },
  decadeChipActive: {
    backgroundColor: '#DBEAFE',
    borderColor: colors.brandBlue
  },
  decadeChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569'
  },
  decadeChipTextActive: {
    color: colors.brandBlue,
    fontWeight: '800'
  },

  // Years Grid
  yearsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  yearChip: {
    width: '18%',
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center'
  },
  yearChipActive: {
    backgroundColor: colors.brandBlue,
    borderColor: colors.brandBlue
  },
  yearChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0A2540'
  },
  yearChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800'
  },

  // Months Grid
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  monthTile: {
    width: '22.5%',
    height: 54,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center'
  },
  monthTileActive: {
    backgroundColor: colors.brandBlue,
    borderColor: colors.brandBlue
  },
  monthNumText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B'
  },
  monthNumTextActive: {
    color: '#DBEAFE'
  },
  monthNameText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0A2540'
  },
  monthNameTextActive: {
    color: '#FFFFFF'
  },

  // Days Grid
  daysScrollView: {
    maxHeight: 180
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 10
  },
  dayTile: {
    width: '12%',
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center'
  },
  dayTileActive: {
    backgroundColor: colors.brandBlue,
    borderColor: colors.brandBlue
  },
  dayTileText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0A2540'
  },
  dayTileTextActive: {
    color: '#FFFFFF',
    fontWeight: '800'
  },

  // Bottom Buttons
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cancelBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#64748B'
  },
  applyBtn: {
    flex: 2,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.brandBlue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.brandBlue,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3
  },
  applyBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF'
  }
});
