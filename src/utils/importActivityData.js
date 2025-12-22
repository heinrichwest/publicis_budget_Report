import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Sample data from Excel file - first 20 rows
const ACTIVITY_DATA = [
  {
    market: 'Botswana',
    businessUnit: 'CIB',
    campaign: 'CIB THEMATIC',
    medium: 'Television',
    conversionRate: 1.32,
    monthlySpend: { Apr: 27337.76, May: 23628.32, Jun: 11128.32 }
  },
  {
    market: 'Botswana',
    businessUnit: 'CIB',
    campaign: 'CIB THEMATIC',
    medium: 'Digital',
    conversionRate: 1.32,
    monthlySpend: { May: 40000, Jun: 40000 }
  },
  {
    market: 'Botswana',
    businessUnit: 'CIB',
    campaign: 'CIB THEMATIC',
    medium: 'DOOH',
    conversionRate: 1.32,
    monthlySpend: { Apr: 33580.08, May: 33580.08, Jun: 33580.08 }
  },
  {
    market: 'Botswana',
    businessUnit: 'CIB',
    campaign: 'CIB THEMATIC',
    medium: 'Radio',
    conversionRate: 1.32,
    monthlySpend: { Apr: 11968.4, May: 9214.84, Jun: 9214.84 }
  },
  {
    market: 'Botswana',
    businessUnit: 'CIB',
    campaign: 'CIB THEMATIC',
    medium: 'OOH',
    conversionRate: 1.32,
    monthlySpend: { Apr: 10000, May: 10000, Jun: 10000 }
  },
  {
    market: 'Botswana',
    businessUnit: 'CIB',
    campaign: 'CIB THEMATIC',
    medium: 'Print',
    conversionRate: 1.32,
    monthlySpend: { Apr: 12570, May: 16650, Jun: 16560 }
  },
  {
    market: 'Botswana',
    businessUnit: 'CIB',
    campaign: 'CIB THEMATIC',
    medium: 'Online Publications',
    conversionRate: 1.32,
    monthlySpend: { Apr: 9579.8, May: 9579.8 }
  },
  {
    market: 'Botswana',
    businessUnit: 'CIB',
    campaign: 'CIB ACCESS',
    medium: 'Television',
    conversionRate: 1.32,
    monthlySpend: { Jan: 20401.92, Feb: 27820.08, Mar: 31530.24 }
  },
  {
    market: 'Botswana',
    businessUnit: 'CIB',
    campaign: 'CIB ACCESS',
    medium: 'Digital',
    conversionRate: 1.32,
    monthlySpend: { Jan: 25000, Feb: 25000, Mar: 25000, Apr: 25000 }
  },
  {
    market: 'Botswana',
    businessUnit: 'CIB',
    campaign: 'CIB ACCESS',
    medium: 'OOH',
    conversionRate: 1.32,
    monthlySpend: { Jan: 84080.8, Feb: 94080.8, Mar: 84080.8 }
  },
  {
    market: 'Botswana',
    businessUnit: 'CIB',
    campaign: 'CIB ACCESS',
    medium: 'Print',
    conversionRate: 1.32,
    monthlySpend: { Jan: 40715.16, Feb: 53414.24 }
  },
  {
    market: 'Botswana',
    businessUnit: 'CIB',
    campaign: 'CIB ACCESS',
    medium: 'Online Publications',
    conversionRate: 1.32,
    monthlySpend: { Jan: 12814.32 }
  },
  {
    market: 'Botswana',
    businessUnit: 'RBB',
    campaign: 'CARD ACQUISITION',
    medium: 'Radio',
    conversionRate: 1.32,
    monthlySpend: { Jan: 27733.3 }
  },
  {
    market: 'Botswana',
    businessUnit: 'RBB',
    campaign: 'CARD ACQUISITION',
    medium: 'OOH',
    conversionRate: 1.32,
    monthlySpend: { Jan: 128875.48 }
  },
  {
    market: 'Botswana',
    businessUnit: 'RBB',
    campaign: 'CARD ACQUISITION',
    medium: 'Print',
    conversionRate: 1.32,
    monthlySpend: { Jan: 27370 }
  },
  {
    market: 'Botswana',
    businessUnit: 'RBB',
    campaign: 'CARD ACQUISITION',
    medium: 'Online Publications',
    conversionRate: 1.32,
    monthlySpend: { Jan: 25748 }
  },
  {
    market: 'Botswana',
    businessUnit: 'RBB',
    campaign: 'SELECTIVE RECEIVABLE FINANCE',
    medium: 'Digital',
    conversionRate: 1.32,
    monthlySpend: { Jun: 35000 }
  }
];

const calculateTotalSpend = (monthlySpend) => {
  return Object.values(monthlySpend).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
};

const convertToZAR = (localAmount, conversionRate) => {
  return localAmount * conversionRate;
};

export const importActivityData = async () => {
  try {
    // Check if data already exists
    const snapshot = await getDocs(collection(db, 'activityPlan'));
    if (!snapshot.empty) {
      return {
        success: false,
        message: 'Activity data already exists. Clear the collection first if you want to re-import.'
      };
    }

    const results = {
      success: [],
      failed: []
    };

    for (const activity of ACTIVITY_DATA) {
      try {
        const totalLocal = calculateTotalSpend(activity.monthlySpend);
        const totalZAR = convertToZAR(totalLocal, activity.conversionRate);

        await addDoc(collection(db, 'activityPlan'), {
          market: activity.market,
          businessUnit: activity.businessUnit,
          campaign: activity.campaign,
          medium: activity.medium,
          monthlySpend: activity.monthlySpend,
          totalSpendLocal: totalLocal,
          totalSpendZAR: totalZAR,
          conversionRate: activity.conversionRate,
          createdAt: new Date().toISOString(),
          createdBy: 'system-import'
        });

        results.success.push(`${activity.campaign} - ${activity.medium}`);
      } catch (error) {
        results.failed.push({
          activity: `${activity.campaign} - ${activity.medium}`,
          error: error.message
        });
      }
    }

    return {
      success: true,
      imported: results.success.length,
      failed: results.failed.length,
      details: results
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error importing data: ' + error.message
    };
  }
};

export default importActivityData;
