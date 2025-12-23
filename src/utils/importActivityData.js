import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// All activity data from Excel file
const ACTIVITY_DATA = [
  {
    "market": "Botswana",
    "businessUnit": "CIB",
    "campaign": "CIB THEMATIC",
    "medium": "Television",
    "conversionRate": 1.32,
    "monthlySpend": {
      "Apr": 27337.76,
      "May": 23628.32,
      "Jun": 11128.32
    }
  },
  {
    "market": "Botswana",
    "businessUnit": "CIB",
    "campaign": "CIB THEMATIC",
    "medium": "Digital",
    "conversionRate": 1.32,
    "monthlySpend": {
      "May": 40000,
      "Jun": 40000
    }
  },
  {
    "market": "Botswana",
    "businessUnit": "CIB",
    "campaign": "CIB THEMATIC",
    "medium": "DOOH",
    "conversionRate": 1.32,
    "monthlySpend": {
      "Apr": 33580.08,
      "May": 33580.08,
      "Jun": 33580.08
    }
  },
  {
    "market": "Botswana",
    "businessUnit": "CIB",
    "campaign": "CIB THEMATIC",
    "medium": "Radio",
    "conversionRate": 1.32,
    "monthlySpend": {
      "Apr": 11968.4,
      "May": 9214.84,
      "Jun": 9214.84
    }
  },
  {
    "market": "Botswana",
    "businessUnit": "CIB",
    "campaign": "CIB THEMATIC",
    "medium": "OOH",
    "conversionRate": 1.32,
    "monthlySpend": {
      "Apr": 10000,
      "May": 10000,
      "Jun": 10000
    }
  },
  {
    "market": "Botswana",
    "businessUnit": "CIB",
    "campaign": "CIB THEMATIC",
    "medium": "Print",
    "conversionRate": 1.32,
    "monthlySpend": {
      "Apr": 12570,
      "May": 16650,
      "Jun": 16560
    }
  },
  {
    "market": "Botswana",
    "businessUnit": "CIB",
    "campaign": "CIB THEMATIC",
    "medium": "Online Publications",
    "conversionRate": 1.32,
    "monthlySpend": {
      "Apr": 9579.8,
      "May": 9579.8
    }
  },
  {
    "market": "Botswana",
    "businessUnit": "CIB",
    "campaign": "CIB ACCESS",
    "medium": "Television",
    "conversionRate": 1.32,
    "monthlySpend": {
      "Jan": 20401.92,
      "Feb": 27820.08,
      "Mar": 31530.24
    }
  },
  {
    "market": "Botswana",
    "businessUnit": "CIB",
    "campaign": "CIB ACCESS",
    "medium": "Digital",
    "conversionRate": 1.32,
    "monthlySpend": {
      "Jan": 25000,
      "Feb": 25000,
      "Mar": 25000,
      "Apr": 25000
    }
  },
  {
    "market": "Botswana",
    "businessUnit": "CIB",
    "campaign": "CIB ACCESS",
    "medium": "OOH",
    "conversionRate": 1.32,
    "monthlySpend": {
      "Jan": 84080.8,
      "Feb": 94080.8,
      "Mar": 84080.8
    }
  },
  {
    "market": "Botswana",
    "businessUnit": "CIB",
    "campaign": "CIB ACCESS",
    "medium": "Print",
    "conversionRate": 1.32,
    "monthlySpend": {
      "Jan": 40715.16,
      "Feb": 53414.24
    }
  },
  {
    "market": "Botswana",
    "businessUnit": "CIB",
    "campaign": "CIB ACCESS",
    "medium": "Online Publications",
    "conversionRate": 1.32,
    "monthlySpend": {
      "Jan": 12814.32
    }
  },
  {
    "market": "Botswana",
    "businessUnit": "RBB",
    "campaign": "CARD ACQUISITION",
    "medium": "Radio",
    "conversionRate": 1.32,
    "monthlySpend": {
      "Jan": 27733.3
    }
  },
  {
    "market": "Botswana",
    "businessUnit": "RBB",
    "campaign": "CARD ACQUISITION",
    "medium": "OOH",
    "conversionRate": 1.32,
    "monthlySpend": {
      "Jan": 128875.48
    }
  },
  {
    "market": "Botswana",
    "businessUnit": "RBB",
    "campaign": "CARD ACQUISITION",
    "medium": "Print",
    "conversionRate": 1.32,
    "monthlySpend": {
      "Jan": 27370
    }
  },
  {
    "market": "Botswana",
    "businessUnit": "RBB",
    "campaign": "CARD ACQUISITION",
    "medium": "Online Publications",
    "conversionRate": 1.32,
    "monthlySpend": {
      "Jan": 25748
    }
  },
  {
    "market": "Botswana",
    "businessUnit": "RBB",
    "campaign": "SELECTIVE RECEIVABLE FINANCE",
    "medium": "Digital",
    "conversionRate": 1.32,
    "monthlySpend": {
      "Jun": 35000
    }
  },
  {
    "market": "Botswana",
    "businessUnit": "RBB",
    "campaign": "SELECTIVE RECEIVABLE FINANCE",
    "medium": "DOOH",
    "conversionRate": 1.32,
    "monthlySpend": {
      "Apr": 31760,
      "May": 31760,
      "Jun": 31760
    }
  },
  {
    "market": "Botswana",
    "businessUnit": "RBB",
    "campaign": "SELECTIVE RECEIVABLE FINANCE",
    "medium": "OOH",
    "conversionRate": 1.32,
    "monthlySpend": {
      "Apr": 6000,
      "May": 6000,
      "Jun": 6000
    }
  },
  {
    "market": "Botswana",
    "businessUnit": "RBB",
    "campaign": "SELECTIVE RECEIVABLE FINANCE",
    "medium": "Print",
    "conversionRate": 1.32,
    "monthlySpend": {
      "Apr": 43678.64
    }
  },
  {
    "market": "Botswana",
    "businessUnit": "RBB",
    "campaign": "SELECTIVE RECEIVABLE FINANCE",
    "medium": "Online Publications",
    "conversionRate": 1.32,
    "monthlySpend": {
      "Apr": 9581.6
    }
  },
  {
    "market": "Botswana",
    "businessUnit": "Brand",
    "campaign": "BRAND",
    "medium": "OOH",
    "conversionRate": 1.32,
    "monthlySpend": {
      "Mar": 8393,
      "Apr": 48795.3,
      "May": 5964.48,
      "Jun": 71489,
      "Jul": 69600
    }
  },
  {
    "market": "Botswana",
    "businessUnit": "Brand",
    "campaign": "BRAND",
    "medium": "Print",
    "conversionRate": 1.32,
    "monthlySpend": {
      "Feb": 78901,
      "Mar": 114324.56,
      "Apr": 86809.75,
      "May": 57224.92,
      "Jun": 66209.2,
      "Jul": 27220
    }
  },
  {
    "market": "Botswana",
    "businessUnit": "RBB",
    "campaign": "WIN A TRUCK",
    "medium": "Digital",
    "conversionRate": 1.32,
    "monthlySpend": {
      "May": 35000,
      "Jun": 35000,
      "Jul": 46650
    }
  },
  {
    "market": "Botswana",
    "businessUnit": "RBB",
    "campaign": "WIN A TRUCK",
    "medium": "DOOH",
    "conversionRate": 1.32,
    "monthlySpend": {
      "May": 39824,
      "Jun": 39824,
      "Jul": 48742.4,
      "Aug": 38743
    }
  },
  {
    "market": "Botswana",
    "businessUnit": "RBB",
    "campaign": "WIN A TRUCK",
    "medium": "Radio",
    "conversionRate": 1.32,
    "monthlySpend": {
      "May": 16160,
      "Jun": 14500,
      "Jul": 16899.95,
      "Aug": 19799.6
    }
  },
  {
    "market": "Botswana",
    "businessUnit": "RBB",
    "campaign": "WIN A TRUCK",
    "medium": "OOH",
    "conversionRate": 1.32,
    "monthlySpend": {
      "Jun": 252695,
      "Jul": 21519,
      "Aug": 21519
    }
  },
  {
    "market": "Botswana",
    "businessUnit": "RBB",
    "campaign": "WIN A TRUCK",
    "medium": "Print",
    "conversionRate": 1.32,
    "monthlySpend": {
      "May": 22981.79,
      "Jul": 21326,
      "Aug": 6587
    }
  },
  {
    "market": "Botswana",
    "businessUnit": "RBB",
    "campaign": "WIN A TRUCK",
    "medium": "Online Publications",
    "conversionRate": 1.32,
    "monthlySpend": {
      "May": 7784,
      "Jun": 10000
    }
  },
  {
    "market": "Botswana",
    "businessUnit": "RBB",
    "campaign": "WIN A MORAKA",
    "medium": "Digital",
    "conversionRate": 1.32,
    "monthlySpend": {
      "Jul": 56650
    }
  },
  {
    "market": "Botswana",
    "businessUnit": "RBB",
    "campaign": "WIN A MORAKA",
    "medium": "Television",
    "conversionRate": 1.32,
    "monthlySpend": {
      "Jul": 9902.5,
      "Aug": 9902.5
    }
  },
  {
    "market": "Botswana",
    "businessUnit": "RBB",
    "campaign": "WIN A MORAKA",
    "medium": "Radio",
    "conversionRate": 1.32,
    "monthlySpend": {
      "Jul": 79740.1,
      "Aug": 26279.9
    }
  },
  {
    "market": "Botswana",
    "businessUnit": "RBB",
    "campaign": "WIN A MORAKA",
    "medium": "DOOH",
    "conversionRate": 1.32,
    "monthlySpend": {
      "Jul": 31580,
      "Aug": 31580.08
    }
  },
  {
    "market": "Botswana",
    "businessUnit": "RBB",
    "campaign": "WIN A MORAKA",
    "medium": "Print",
    "conversionRate": 1.32,
    "monthlySpend": {
      "Jul": 24476.6,
      "Aug": 9355
    }
  },
  {
    "market": "Botswana",
    "businessUnit": "RBB",
    "campaign": "WIN A MORAKA",
    "medium": "OOH",
    "conversionRate": 1.32,
    "monthlySpend": {
      "Jul": 21519
    }
  },
  {
    "market": "Botswana",
    "businessUnit": "RBB",
    "campaign": "WIN A MORAKA",
    "medium": "Online Publications",
    "conversionRate": 1.32,
    "monthlySpend": {
      "Jul": 22282
    }
  },
  {
    "market": "Botswana",
    "businessUnit": "RBB",
    "campaign": "BRAND",
    "medium": "Print",
    "conversionRate": 1.32,
    "monthlySpend": {
      "Jul": 73211
    }
  },
  {
    "market": "Botswana",
    "businessUnit": "RBB",
    "campaign": "BRAND",
    "medium": "OOH",
    "conversionRate": 1.32,
    "monthlySpend": {
      "Jul": 71498,
      "Aug": 36650
    }
  },
  {
    "market": "Botswana",
    "businessUnit": "RBB",
    "campaign": "BUSINESS BANKING CREDIT CARD",
    "medium": "Digital",
    "conversionRate": 1.32,
    "monthlySpend": {
      "Jul": 36650,
      "Aug": 26500
    }
  },
  {
    "market": "Botswana",
    "businessUnit": "RBB",
    "campaign": "BUSINESS BANKING CREDIT CARD",
    "medium": "DOOH",
    "conversionRate": 1.32,
    "monthlySpend": {
      "Jul": 26500
    }
  },
  {
    "market": "Botswana",
    "businessUnit": "RBB",
    "campaign": "BUSINESS BANKING CREDIT CARD",
    "medium": "Print",
    "conversionRate": 1.32,
    "monthlySpend": {
      "Jul": 25615
    }
  },
  {
    "market": "Botswana",
    "businessUnit": "RBB",
    "campaign": "BUSINESS BANKING CREDIT CARD",
    "medium": "Online Publications",
    "conversionRate": 1.32,
    "monthlySpend": {
      "Jul": 9580.8
    }
  },
  {
    "market": "Botswana",
    "businessUnit": "RBB",
    "campaign": "GREEN ENERGY LOANS",
    "medium": "Digital",
    "conversionRate": 1.32,
    "monthlySpend": {
      "Jul": 59650,
      "Aug": 59650
    }
  },
  {
    "market": "Botswana",
    "businessUnit": "RBB",
    "campaign": "GREEN ENERGY LOANS",
    "medium": "Radio",
    "conversionRate": 1.32,
    "monthlySpend": {
      "Jul": 13813.3,
      "Aug": 20719.95
    }
  },
  {
    "market": "Botswana",
    "businessUnit": "RBB",
    "campaign": "GREEN ENERGY LOANS",
    "medium": "DOOH",
    "conversionRate": 1.32,
    "monthlySpend": {
      "Jul": 39160.16,
      "Aug": 39160.16
    }
  },
  {
    "market": "Botswana",
    "businessUnit": "RBB",
    "campaign": "GREEN ENERGY LOANS",
    "medium": "Print",
    "conversionRate": 1.32,
    "monthlySpend": {
      "Jul": 19632,
      "Aug": 13072
    }
  },
  {
    "market": "Botswana",
    "businessUnit": "RBB",
    "campaign": "GREEN ENERGY LOANS",
    "medium": "Online Publications",
    "conversionRate": 1.32,
    "monthlySpend": {
      "Jul": 12583.2,
      "Aug": 12583.2
    }
  },
  {
    "market": "Botswana",
    "businessUnit": "RBB",
    "campaign": "PURPOSE ACCOUNT",
    "medium": "Digital",
    "conversionRate": 1.32,
    "monthlySpend": {
      "Aug": 43650
    }
  },
  {
    "market": "Botswana",
    "businessUnit": "RBB",
    "campaign": "PURPOSE ACCOUNT",
    "medium": "Radio",
    "conversionRate": 1.32,
    "monthlySpend": {
      "Aug": 15460.6
    }
  },
  {
    "market": "Botswana",
    "businessUnit": "RBB",
    "campaign": "PURPOSE ACCOUNT",
    "medium": "DOOH",
    "conversionRate": 1.32,
    "monthlySpend": {
      "Aug": 30580.08
    }
  },
  {
    "market": "Botswana",
    "businessUnit": "RBB",
    "campaign": "PURPOSE ACCOUNT",
    "medium": "Print",
    "conversionRate": 1.32,
    "monthlySpend": {
      "Aug": 30684.24
    }
  },
  {
    "market": "Botswana",
    "businessUnit": "RBB",
    "campaign": "PURPOSE ACCOUNT",
    "medium": "Online Publications",
    "conversionRate": 1.32,
    "monthlySpend": {
      "Aug": 9221.52
    }
  },
  {
    "market": "Ghana",
    "businessUnit": "RBB",
    "campaign": "SME LOANS @10 BOOSTER CAMPAIGN",
    "medium": "Digital",
    "conversionRate": 1.68,
    "monthlySpend": {
      "Jan": 16800,
      "Feb": 21793.99,
      "Mar": 23997.12
    }
  },
  {
    "market": "Ghana",
    "businessUnit": "RBB",
    "campaign": "SME LOANS @10 BOOSTER CAMPAIGN",
    "medium": "Radio",
    "conversionRate": 1.68,
    "monthlySpend": {
      "Jan": 181557.3468539326,
      "Feb": 202085.51,
      "Mar": 65230.020000000004
    }
  },
  {
    "market": "Ghana",
    "businessUnit": "RBB",
    "campaign": "SME LOANS @10 BOOSTER CAMPAIGN",
    "medium": "OOH",
    "conversionRate": 1.68,
    "monthlySpend": {
      "Jan": 59137.159999999996,
      "Feb": 59137.159999999996,
      "Mar": 13260
    }
  },
  {
    "market": "Ghana",
    "businessUnit": "RBB",
    "campaign": "SME LOANS @10 BOOSTER CAMPAIGN",
    "medium": "Other",
    "conversionRate": 1.68,
    "monthlySpend": {
      "Jan": 6961.5,
      "Feb": 119860
    }
  },
  {
    "market": "Ghana",
    "businessUnit": "RBB",
    "campaign": "PRINT ONLY CAMPAIGNS",
    "medium": "Print",
    "conversionRate": 1.68,
    "monthlySpend": {
      "Jan": 11588.45,
      "Feb": 11588.45,
      "Mar": 83795.16,
      "Apr": 28559.55,
      "May": 12747.29,
      "Jun": 12747.29,
      "Jul": 25494.573600000003,
      "Sep": 21386.23
    }
  },
  {
    "market": "Ghana",
    "businessUnit": "RBB",
    "campaign": "OOH ONLY CAMPAIGNS - ADHOC",
    "medium": "OOH",
    "conversionRate": 1.68,
    "monthlySpend": {
      "Sep": 10000
    }
  },
  {
    "market": "Ghana",
    "businessUnit": "RBB",
    "campaign": "DIGITAL CAMPAIGNS ONLY",
    "medium": "Digital",
    "conversionRate": 1.68,
    "monthlySpend": {
      "Jan": 819.1500000000001,
      "Feb": 13911.150000000001,
      "Mar": 13655.559999999998,
      "Apr": 25444.32,
      "May": 7938.91,
      "Jun": 38343.565,
      "Jul": 30477.23,
      "Aug": 37765.08
    }
  },
  {
    "market": "Ghana",
    "businessUnit": "RBB",
    "campaign": "Airport OOH",
    "medium": "OOH",
    "conversionRate": 1.68,
    "monthlySpend": {
      "Feb": 89551.33,
      "Mar": 92372.67,
      "Apr": 92372.67,
      "May": 92372.67,
      "Jun": 92372.67,
      "Jul": 92372.67,
      "Aug": 92372.67,
      "Sep": 92372.67
    }
  },
  {
    "market": "Ghana",
    "businessUnit": "RBB",
    "campaign": "Ready To Work Webinar",
    "medium": "Television",
    "conversionRate": 1.68,
    "monthlySpend": {
      "Feb": 1275,
      "May": 1530
    }
  },
  {
    "market": "Ghana",
    "businessUnit": "RBB",
    "campaign": "Ready To Work Webinar",
    "medium": "Digital",
    "conversionRate": 1.68,
    "monthlySpend": {
      "Feb": 13498.264411428572,
      "May": 7446.12
    }
  },
  {
    "market": "Ghana",
    "businessUnit": "RBB",
    "campaign": "Ready To Work Webinar",
    "medium": "Radio",
    "conversionRate": 1.68,
    "monthlySpend": {
      "Feb": 11568.074999999999,
      "May": 11823.93
    }
  },
  {
    "market": "Ghana",
    "businessUnit": "RBB",
    "campaign": "Acquisition Campaign",
    "medium": "Television",
    "conversionRate": 1.68,
    "monthlySpend": {
      "Jul": 322783.895,
      "Aug": 128769.11
    }
  },
  {
    "market": "Ghana",
    "businessUnit": "RBB",
    "campaign": "Acquisition Campaign",
    "medium": "Digital",
    "conversionRate": 1.68,
    "monthlySpend": {
      "Mar": 44979.84,
      "Apr": 38426.56,
      "May": 9236,
      "Jun": 30422.72,
      "Jul": 35821.6,
      "Aug": 35821.6,
      "Sep": 82322.56
    }
  },
  {
    "market": "Ghana",
    "businessUnit": "RBB",
    "campaign": "Acquisition Campaign",
    "medium": "Radio",
    "conversionRate": 1.68,
    "monthlySpend": {
      "Mar": 222231.67250000002,
      "Apr": 286994.3625,
      "May": 204376.7,
      "Jun": 179752.54,
      "Jul": 179752.54,
      "Aug": 179752.54,
      "Sep": 179752.54
    }
  },
  {
    "market": "Ghana",
    "businessUnit": "RBB",
    "campaign": "Acquisition Campaign",
    "medium": "OOH",
    "conversionRate": 1.68,
    "monthlySpend": {
      "Mar": 267831.98,
      "Apr": 267831.98,
      "May": 267831.98,
      "Jun": 267831.98,
      "Jul": 267831.98,
      "Aug": 232798.98,
      "Sep": 86528.98
    }
  },
  {
    "market": "Ghana",
    "businessUnit": "RBB",
    "campaign": "Acquisition Campaign",
    "medium": "Print",
    "conversionRate": 1.68,
    "monthlySpend": {
      "Mar": 48743,
      "Apr": 36557.56,
      "May": 48743.4132,
      "Jun": 36557.5599,
      "Jul": 24371.7066
    }
  },
  {
    "market": "Ghana",
    "businessUnit": "RBB",
    "campaign": "KASOA RE-OPENING",
    "medium": "Digital",
    "conversionRate": 1.68,
    "monthlySpend": {
      "Jul": 8200,
      "Sep": 833
    }
  },
  {
    "market": "Ghana",
    "businessUnit": "RBB",
    "campaign": "KASOA RE-OPENING",
    "medium": "Radio",
    "conversionRate": 1.68,
    "monthlySpend": {
      "Jul": 13017.75
    }
  },
  {
    "market": "Ghana",
    "businessUnit": "RBB",
    "campaign": "KASOA RE-OPENING",
    "medium": "OOH",
    "conversionRate": 1.68,
    "monthlySpend": {
      "Jul": 8200
    }
  },
  {
    "market": "Ghana",
    "businessUnit": "CIB",
    "campaign": "KASOA RE-OPENING",
    "medium": "Print",
    "conversionRate": 1.68,
    "monthlySpend": {
      "Jul": 6571.487700000001
    }
  },
  {
    "market": "Ghana",
    "businessUnit": "CIB",
    "campaign": "KASOA RE-OPENING",
    "medium": "Other",
    "conversionRate": 1.68,
    "monthlySpend": {
      "Jul": 30300
    }
  },
  {
    "market": "Ghana",
    "businessUnit": "CIB",
    "campaign": "MOBITAP",
    "medium": "Digital",
    "conversionRate": 1.68,
    "monthlySpend": {
      "Jul": 15772.82,
      "Aug": 15772.82
    }
  },
  {
    "market": "Ghana",
    "businessUnit": "RBB",
    "campaign": "MOBITAP",
    "medium": "Radio",
    "conversionRate": 1.68,
    "monthlySpend": {
      "Jul": 66252.73999999999
    }
  },
  {
    "market": "Ghana",
    "businessUnit": "RBB",
    "campaign": "MOBITAP",
    "medium": "Print",
    "conversionRate": 1.68,
    "monthlySpend": {
      "Jul": 18953.038800000002
    }
  },
  {
    "market": "Ghana",
    "businessUnit": "RBB",
    "campaign": "INSPIRE ME",
    "medium": "Digital",
    "conversionRate": 1.68,
    "monthlySpend": {
      "Jul": 9502.57
    }
  },
  {
    "market": "Ghana",
    "businessUnit": "RBB",
    "campaign": "INSPIRE ME",
    "medium": "Radio",
    "conversionRate": 1.68,
    "monthlySpend": {
      "Jul": 12464.4
    }
  },
  {
    "market": "Ghana",
    "businessUnit": "RBB",
    "campaign": "BLACKSTAR MARATHON",
    "medium": "Digital",
    "conversionRate": 1.68,
    "monthlySpend": {
      "Jul": 10990.87,
      "Aug": 10990.87
    }
  },
  {
    "market": "Ghana",
    "businessUnit": "RBB",
    "campaign": "BLACKSTAR MARATHON",
    "medium": "Radio",
    "conversionRate": 1.68,
    "monthlySpend": {
      "Jul": 15012.7
    }
  },
  {
    "market": "Ghana",
    "businessUnit": "RBB",
    "campaign": "Agency Banking",
    "medium": "Radio",
    "conversionRate": 1.68,
    "monthlySpend": {
      "Aug": 105350.6575,
      "Sep": 52675.32875
    }
  },
  {
    "market": "Ghana",
    "businessUnit": "RBB",
    "campaign": "SHE BUSINESS",
    "medium": "Television",
    "conversionRate": 1.68,
    "monthlySpend": {
      "Apr": 40130.03,
      "May": 9487.53
    }
  },
  {
    "market": "Ghana",
    "businessUnit": "RBB",
    "campaign": "SHE BUSINESS",
    "medium": "Digital",
    "conversionRate": 1.68,
    "monthlySpend": {
      "Apr": 10840.5,
      "May": 11222.145,
      "Aug": 9426.12
    }
  },
  {
    "market": "Ghana",
    "businessUnit": "RBB",
    "campaign": "SHE BUSINESS",
    "medium": "Radio",
    "conversionRate": 1.68,
    "monthlySpend": {
      "Apr": 79654,
      "May": 50933.3175
    }
  },
  {
    "market": "Ghana",
    "businessUnit": "RBB",
    "campaign": "SHE BUSINESS",
    "medium": "Print",
    "conversionRate": 1.68,
    "monthlySpend": {
      "Apr": 25494.57,
      "May": 12747.29
    }
  },
  {
    "market": "Ghana",
    "businessUnit": "RBB",
    "campaign": "GLOBAL FINANCE",
    "medium": "Digital",
    "conversionRate": 1.68,
    "monthlySpend": {
      "Apr": 10599.27
    }
  },
  {
    "market": "Ghana",
    "businessUnit": "RBB",
    "campaign": "GLOBAL FINANCE",
    "medium": "OOH",
    "conversionRate": 1.68,
    "monthlySpend": {
      "Apr": 30000
    }
  },
  {
    "market": "Ghana",
    "businessUnit": "RBB",
    "campaign": "GLOBAL FINANCE",
    "medium": "Print",
    "conversionRate": 1.68,
    "monthlySpend": {
      "Apr": 18121
    }
  },
  {
    "market": "Ghana",
    "businessUnit": "RBB",
    "campaign": "Mastercard Partnership",
    "medium": "Television",
    "conversionRate": 1.68,
    "monthlySpend": {
      "Jun": 286929.0855
    }
  },
  {
    "market": "Ghana",
    "businessUnit": "RBB",
    "campaign": "Mastercard Partnership",
    "medium": "Digital",
    "conversionRate": 1.68,
    "monthlySpend": {
      "Jun": 8221.88,
      "Jul": 24621.27,
      "Aug": 24621.27
    }
  },
  {
    "market": "Hub",
    "businessUnit": "Brand",
    "campaign": "Absa ARO ROA Social Corner SuperSport Sponsorship",
    "medium": "DIGITAL",
    "conversionRate": 1,
    "monthlySpend": {
      "Aug": 3168846
    }
  },
  {
    "market": "Hub",
    "businessUnit": "CIB",
    "campaign": "Absa ARO_CIB_Transactional Banking_AIS Custody DGT",
    "medium": "DIGITAL",
    "conversionRate": 1,
    "monthlySpend": {
      "Aug": 13323.63
    }
  },
  {
    "market": "Hub",
    "businessUnit": "Brand",
    "campaign": "Absa ARO_MEST Sponsorship ",
    "medium": "DIGITAL",
    "conversionRate": 1,
    "monthlySpend": {
      "Sep": 299537.6,
      "Oct": 97961.22045614026,
      "Dec": 85280.99429132108
    }
  },
  {
    "market": "Hub",
    "businessUnit": "Brand",
    "campaign": "Absa ARO_MEST Sponsorship",
    "medium": "SOCIAL",
    "conversionRate": 1,
    "monthlySpend": {
      "Sep": 160302.36
    }
  },
  {
    "market": "Hub",
    "businessUnit": "Brand",
    "campaign": "Absa ARO_MEST Sponsorship ",
    "medium": "TECH COSTS",
    "conversionRate": 1,
    "monthlySpend": {
      "Sep": 41733.58
    }
  },
  {
    "market": "Hub",
    "businessUnit": "CIB",
    "campaign": "Absa CIB Transactional GTR Africa ARO",
    "medium": "DIGITAL",
    "conversionRate": 1,
    "monthlySpend": {
      "Mar": 91469.48999999999
    }
  },
  {
    "market": "Hub",
    "businessUnit": "CIB",
    "campaign": "Absa CIB Transactional GTR Africa ARO",
    "medium": "TECH COSTS",
    "conversionRate": 1,
    "monthlySpend": {
      "Mar": 7344.5
    }
  },
  {
    "market": "Hub",
    "businessUnit": "CIB",
    "campaign": "Absa CIB_Property Finance_EAPI Conference_ARO OOH",
    "medium": "OUTDOOR",
    "conversionRate": 1,
    "monthlySpend": {
      "May": 176000
    }
  },
  {
    "market": "Hub",
    "businessUnit": "CIB",
    "campaign": "Absa_ ARO_ DSTV_Showmax TV Schedule March 2026",
    "medium": "TELEVISION",
    "conversionRate": 1,
    "monthlySpend": {
      "Feb": 517634
    }
  },
  {
    "market": "Kenya",
    "businessUnit": "RBB",
    "campaign": "PRESTIGE",
    "medium": "Television",
    "conversionRate": 0.14,
    "monthlySpend": {
      "Mar": 424350
    }
  },
  {
    "market": "Kenya",
    "businessUnit": "RBB",
    "campaign": "PRESTIGE",
    "medium": "Digital",
    "conversionRate": 0.14,
    "monthlySpend": {
      "Mar": 384066,
      "Apr": 105200.34,
      "May": 117489,
      "Jun": 352847.67,
      "Aug": 313723.06,
      "Sep": 136819.76
    }
  },
  {
    "market": "Kenya",
    "businessUnit": "RBB",
    "campaign": "PRESTIGE",
    "medium": "DOOH",
    "conversionRate": 0.14,
    "monthlySpend": {
      "Mar": 900000
    }
  },
  {
    "market": "Kenya",
    "businessUnit": "RBB",
    "campaign": "PRESTIGE",
    "medium": "Radio",
    "conversionRate": 0.14,
    "monthlySpend": {
      "Feb": 1100000,
      "Mar": 2717366
    }
  },
  {
    "market": "Kenya",
    "businessUnit": "RBB",
    "campaign": "PRESTIGE",
    "medium": "OOH",
    "conversionRate": 0.14,
    "monthlySpend": {
      "Mar": 1450000,
      "Apr": 1450000,
      "May": 1210000,
      "Jun": 110000
    }
  },
  {
    "market": "Kenya",
    "businessUnit": "Brand",
    "campaign": "BRAND",
    "medium": "Television",
    "conversionRate": 0.14,
    "monthlySpend": {
      "Feb": 1273050
    }
  },
  {
    "market": "Kenya",
    "businessUnit": "RBB",
    "campaign": "INTERNATIONAL WOMEN'S DAY",
    "medium": "Digital",
    "conversionRate": 0.14,
    "monthlySpend": {
      "Mar": 269833
    }
  },
  {
    "market": "Kenya",
    "businessUnit": "RBB",
    "campaign": "TIMIZA",
    "medium": "Digital",
    "conversionRate": 0.14,
    "monthlySpend": {
      "Jan": 1366132,
      "Feb": 662096.7,
      "Apr": 469505.96,
      "May": 593749,
      "Jun": 595045.99,
      "Jul": 1855262.22,
      "Aug": 1098352.57,
      "Sep": 1442242.69
    }
  },
  {
    "market": "Kenya",
    "businessUnit": "RBB",
    "campaign": "TIMIZA",
    "medium": "Radio",
    "conversionRate": 0.14,
    "monthlySpend": {
      "Jan": 574000
    }
  },
  {
    "market": "Kenya",
    "businessUnit": "RBB",
    "campaign": "BACK TO SCHOOL",
    "medium": "Television",
    "conversionRate": 0.14,
    "monthlySpend": {
      "Jan": 1033200
    }
  },
  {
    "market": "Kenya",
    "businessUnit": "RBB",
    "campaign": "BACK TO SCHOOL",
    "medium": "Digital",
    "conversionRate": 0.14,
    "monthlySpend": {
      "Jan": 202500
    }
  },
  {
    "market": "Kenya",
    "businessUnit": "CIB",
    "campaign": "CIB",
    "medium": "Digital",
    "conversionRate": 0.14,
    "monthlySpend": {
      "Jan": 393869,
      "Feb": 338172.3,
      "Mar": 1109246,
      "Apr": 527277.17,
      "May": 303156,
      "Jul": 58887.08,
      "Aug": 223813.73,
      "Sep": 347449.2
    }
  },
  {
    "market": "Kenya",
    "businessUnit": "CIB",
    "campaign": "CIB",
    "medium": "Print",
    "conversionRate": 0.14,
    "monthlySpend": {
      "Feb": 150000
    }
  },
  {
    "market": "Kenya",
    "businessUnit": "CIB",
    "campaign": "CIB",
    "medium": "Television",
    "conversionRate": 0.14,
    "monthlySpend": {
      "Sep": 780000
    }
  },
  {
    "market": "Kenya",
    "businessUnit": "Brand",
    "campaign": "FOUNDATION",
    "medium": "Digital",
    "conversionRate": 0.14,
    "monthlySpend": {
      "Jan": 389789,
      "Feb": 61379.1,
      "Jul": 66500,
      "Aug": 371918.54
    }
  },
  {
    "market": "Kenya",
    "businessUnit": "Brand",
    "campaign": "NOTICES",
    "medium": "Print",
    "conversionRate": 0.14,
    "monthlySpend": {
      "Feb": 248747,
      "Apr": 248747,
      "Jul": 248747
    }
  },
  {
    "market": "Kenya",
    "businessUnit": "Brand",
    "campaign": "VALENTINE",
    "medium": "Digital",
    "conversionRate": 0.14,
    "monthlySpend": {
      "Feb": 1359000
    }
  },
  {
    "market": "Kenya",
    "businessUnit": "Brand",
    "campaign": "READY TO WORK",
    "medium": "Digital",
    "conversionRate": 0.14,
    "monthlySpend": {
      "Sep": 182547
    }
  },
  {
    "market": "Kenya",
    "businessUnit": "Brand",
    "campaign": "MKO",
    "medium": "Digital",
    "conversionRate": 0.14,
    "monthlySpend": {
      "Feb": 1581777
    }
  },
  {
    "market": "Kenya",
    "businessUnit": "RBB",
    "campaign": "FINANCIALS",
    "medium": "Print",
    "conversionRate": 0.14,
    "monthlySpend": {
      "Mar": 2253622,
      "Apr": 2253622,
      "Aug": 2634390
    }
  },
  {
    "market": "Kenya",
    "businessUnit": "RBB",
    "campaign": "PERSONAL BANKING",
    "medium": "Digital",
    "conversionRate": 0.14,
    "monthlySpend": {
      "Jul": 1122880.43,
      "Aug": 1008081.48,
      "Sep": 2218111
    }
  },
  {
    "market": "Kenya",
    "businessUnit": "RBB",
    "campaign": "PERSONAL BANKING",
    "medium": "Radio",
    "conversionRate": 0.14,
    "monthlySpend": {
      "Sep": 2788000
    }
  },
  {
    "market": "Kenya",
    "businessUnit": "RBB",
    "campaign": "PERSONAL BANKING",
    "medium": "Television",
    "conversionRate": 0.14,
    "monthlySpend": {
      "Sep": 2020480
    }
  },
  {
    "market": "Kenya",
    "businessUnit": "RBB",
    "campaign": "PERSONAL BANKING",
    "medium": "OOH",
    "conversionRate": 0.14,
    "monthlySpend": {
      "Sep": 2450000
    }
  },
  {
    "market": "Kenya",
    "businessUnit": "RBB",
    "campaign": "BUSINESS BANKING",
    "medium": "Digital",
    "conversionRate": 0.14,
    "monthlySpend": {
      "Jul": 33135.62,
      "Aug": 159794.18,
      "Sep": 350727.65
    }
  },
  {
    "market": "Kenya",
    "businessUnit": "RBB",
    "campaign": "LA RIBA",
    "medium": "Digital",
    "conversionRate": 0.14,
    "monthlySpend": {
      "Jul": 66500,
      "Aug": 238844.06,
      "Sep": 246280.09
    }
  },
  {
    "market": "Kenya",
    "businessUnit": "RBB",
    "campaign": "LA RIBA",
    "medium": "Radio",
    "conversionRate": 0.14,
    "monthlySpend": {
      "Jul": 574000,
      "Aug": 492000
    }
  },
  {
    "market": "Kenya",
    "businessUnit": "RBB",
    "campaign": "AFFLUENT",
    "medium": "OOH",
    "conversionRate": 0.14,
    "monthlySpend": {
      "Jul": 110000,
      "Aug": 110000
    }
  },
  {
    "market": "Kenya",
    "businessUnit": "RBB/ CIB",
    "campaign": "ALWAYS ON SEARCH",
    "medium": "Digital",
    "conversionRate": 0.14,
    "monthlySpend": {
      "Jul": 242916.52,
      "Aug": 308974.96,
      "Sep": 332041.15
    }
  },
  {
    "market": "Kenya",
    "businessUnit": "RBB",
    "campaign": "MULTICURRENCY",
    "medium": "Digital",
    "conversionRate": 0.14,
    "monthlySpend": {
      "Aug": 679885.36,
      "Sep": 542142.58
    }
  },
  {
    "market": "Kenya",
    "businessUnit": "RBB",
    "campaign": "MULTICURRENCY",
    "medium": "Influencers",
    "conversionRate": 0.14,
    "monthlySpend": {
      "Jul": 682000,
      "Aug": 682000
    }
  },
  {
    "market": "Mauritius",
    "businessUnit": "RBB",
    "campaign": "Radio plus Sponsorship",
    "medium": "Radio",
    "conversionRate": 0.39,
    "monthlySpend": {
      "Jan": 200000,
      "Feb": 200000,
      "Mar": 200000,
      "Apr": 200000,
      "May": 200000,
      "Jun": 200000,
      "Jul": 200000,
      "Aug": 200000,
      "Sep": 200000
    }
  },
  {
    "market": "Mauritius",
    "businessUnit": "CIB",
    "campaign": "CIB Campaign  ",
    "medium": "Digital",
    "conversionRate": 0.39,
    "monthlySpend": {
      "Feb": 9710,
      "Mar": 29130,
      "Jun": 327613
    }
  },
  {
    "market": "Mauritius",
    "businessUnit": "CIB",
    "campaign": "CIB Campaign  ",
    "medium": "OOH",
    "conversionRate": 0.39,
    "monthlySpend": {
      "Jan": 208000,
      "Feb": 210917,
      "Mar": 206666.66666666666,
      "Apr": 147000,
      "May": 66000,
      "Jun": 66000,
      "Jul": 177088
    }
  },
  {
    "market": "Mauritius",
    "businessUnit": "CIB",
    "campaign": "CIB Campaign  ",
    "medium": "Print",
    "conversionRate": 0.39,
    "monthlySpend": {
      "Feb": 51376.15,
      "Mar": 45000,
      "Jun": 134510
    }
  },
  {
    "market": "Mauritius",
    "businessUnit": "RBB",
    "campaign": "RB - EOY + Card Press communique",
    "medium": "Digital",
    "conversionRate": 0.39,
    "monthlySpend": {
      "Mar": 217526.33299999998
    }
  },
  {
    "market": "Mauritius",
    "businessUnit": "RBB",
    "campaign": "RB - EOY + Card Press communique",
    "medium": "Radio",
    "conversionRate": 0.39,
    "monthlySpend": {
      "Jan": 26705.9
    }
  },
  {
    "market": "Mauritius",
    "businessUnit": "RBB",
    "campaign": "RB - EOY + Card Press communique",
    "medium": "Print",
    "conversionRate": 0.39,
    "monthlySpend": {
      "Jan": 51120,
      "Feb": 22320,
      "Mar": 23940
    }
  },
  {
    "market": "Mauritius",
    "businessUnit": "RBB",
    "campaign": "Pensioners Savings ",
    "medium": "Television",
    "conversionRate": 0.39,
    "monthlySpend": {
      "Jan": 316120,
      "Feb": 162960,
      "Mar": 217140
    }
  },
  {
    "market": "Mauritius",
    "businessUnit": "RBB",
    "campaign": "Pensioners Savings ",
    "medium": "Digital",
    "conversionRate": 0.39,
    "monthlySpend": {
      "Jan": 113050,
      "Mar": 36000,
      "Jun": 350290,
      "Jul": 176310,
      "Aug": 111770
    }
  },
  {
    "market": "Mauritius",
    "businessUnit": "RBB",
    "campaign": "Pensioners Savings ",
    "medium": "Radio",
    "conversionRate": 0.39,
    "monthlySpend": {
      "Jan": 42644,
      "Feb": 30975,
      "Mar": 91990.5
    }
  },
  {
    "market": "Mauritius",
    "businessUnit": "RBB",
    "campaign": "Pensioners Savings ",
    "medium": "OOH",
    "conversionRate": 0.39,
    "monthlySpend": {
      "Jan": 566532
    }
  },
  {
    "market": "Mauritius",
    "businessUnit": "RBB",
    "campaign": "Pensioners Savings ",
    "medium": "Print",
    "conversionRate": 0.39,
    "monthlySpend": {
      "Jan": 20718.75,
      "Feb": 23760,
      "Jul": 12240
    }
  },
  {
    "market": "Mauritius",
    "businessUnit": "RBB",
    "campaign": " Premier League Card 2025       ",
    "medium": "Digital",
    "conversionRate": 0.39,
    "monthlySpend": {
      "Jan": 348550
    }
  },
  {
    "market": "Mauritius",
    "businessUnit": "RBB",
    "campaign": " Premier League Card 2025       ",
    "medium": "Radio",
    "conversionRate": 0.39,
    "monthlySpend": {
      "Jan": 140884.5,
      "Feb": 90146,
      "Mar": 105632.8
    }
  },
  {
    "market": "Mauritius",
    "businessUnit": "RBB",
    "campaign": " Premier League Card 2025       ",
    "medium": "Print",
    "conversionRate": 0.39,
    "monthlySpend": {
      "Jan": 20718.75,
      "Feb": 44478.75,
      "Mar": 23760
    }
  },
  {
    "market": "Mauritius",
    "businessUnit": "RBB",
    "campaign": " Premier League Card 2025       ",
    "medium": "DOOH",
    "conversionRate": 0.39,
    "monthlySpend": {
      "Jan": 189000
    }
  },
  {
    "market": "Mauritius",
    "businessUnit": "RBB",
    "campaign": "le Passeport FB",
    "medium": "Digital",
    "conversionRate": 0.39,
    "monthlySpend": {
      "Jan": 24275,
      "Feb": 15000.01,
      "Mar": 9999.843499999999,
      "May": 14953.4,
      "Jul": 15000
    }
  },
  {
    "market": "Mauritius",
    "businessUnit": "Brand",
    "campaign": "Bocuse d'or    ",
    "medium": "Digital",
    "conversionRate": 0.39,
    "monthlySpend": {
      "Jan": 12137.5,
      "Mar": 2427.5,
      "Jun": 18522,
      "Jul": 50977.5,
      "Sep": 16922.5
    }
  },
  {
    "market": "Mauritius",
    "businessUnit": "RBB",
    "campaign": "Saturday Branch opening",
    "medium": "Digital",
    "conversionRate": 0.39,
    "monthlySpend": {
      "Jan": 68691.93849999999,
      "Jul": 20148,
      "Sep": 9710
    }
  },
  {
    "market": "Mauritius",
    "businessUnit": "RBB",
    "campaign": "Saturday Branch opening",
    "medium": "Radio",
    "conversionRate": 0.39,
    "monthlySpend": {
      "Jan": 75332.9,
      "Mar": 49071,
      "Jul": 70085
    }
  },
  {
    "market": "Mauritius",
    "businessUnit": "Brand",
    "campaign": "Absa Social media Post",
    "medium": "Digital",
    "conversionRate": 0.39,
    "monthlySpend": {
      "Feb": 58260,
      "Mar": 116520,
      "Apr": 109382,
      "May": 264791.7,
      "Jun": 271687,
      "Jul": 114092.5,
      "Aug": 177055,
      "Sep": 33985
    }
  },
  {
    "market": "Mauritius",
    "businessUnit": "Brand",
    "campaign": "Absa - Change of PLR - Press Notice     ",
    "medium": "Print",
    "conversionRate": 0.39,
    "monthlySpend": {
      "Feb": 8925
    }
  },
  {
    "market": "Mauritius",
    "businessUnit": "Brand",
    "campaign": "Absa -  Financial Results Advertorial",
    "medium": "Digital",
    "conversionRate": 0.39,
    "monthlySpend": {
      "Apr": 24857
    }
  },
  {
    "market": "Mauritius",
    "businessUnit": "Brand",
    "campaign": "Absa -  Financial Results Advertorial",
    "medium": "Print",
    "conversionRate": 0.39,
    "monthlySpend": {
      "Apr": 169700
    }
  },
  {
    "market": "Mauritius",
    "businessUnit": "Brand",
    "campaign": "Absa Metro Train Wrapping",
    "medium": "OOH",
    "conversionRate": 0.39,
    "monthlySpend": {
      "Jul": 340000
    }
  },
  {
    "market": "Mauritius",
    "businessUnit": "RBB",
    "campaign": "Absa Metro Train Wrapping",
    "medium": "Print",
    "conversionRate": 0.39,
    "monthlySpend": {
      "Feb": 640000,
      "Mar": 640000
    }
  },
  {
    "market": "Mauritius",
    "businessUnit": "RBB",
    "campaign": "ABSA Mortgage Campaign ",
    "medium": "Digital",
    "conversionRate": 0.39,
    "monthlySpend": {
      "Mar": 195553.37,
      "Apr": 272600.45,
      "May": 272600.45,
      "Jun": 98379,
      "Jul": 98379,
      "Aug": 98379
    }
  },
  {
    "market": "Mauritius",
    "businessUnit": "RBB",
    "campaign": "ABSA Mortgage Campaign ",
    "medium": "Radio",
    "conversionRate": 0.39,
    "monthlySpend": {
      "Apr": 68360,
      "May": 77157,
      "Jun": 33355.7,
      "Jul": 30571,
      "Aug": 17329
    }
  },
  {
    "market": "Mauritius",
    "businessUnit": "RBB",
    "campaign": "ABSA Mortgage Campaign ",
    "medium": "Print",
    "conversionRate": 0.39,
    "monthlySpend": {
      "Mar": 60000,
      "Apr": 44718
    }
  },
  {
    "market": "Mauritius",
    "businessUnit": "Brand",
    "campaign": "ABSA Mortgage Campaign ",
    "medium": "DOOH",
    "conversionRate": 0.39,
    "monthlySpend": {
      "Apr": 365500
    }
  },
  {
    "market": "Mauritius",
    "businessUnit": "Brand",
    "campaign": "ABSA Tribeca Digital screen",
    "medium": "DOOH",
    "conversionRate": 0.39,
    "monthlySpend": {
      "Mar": 285000,
      "Apr": 285000,
      "May": 285000,
      "Jun": 285000,
      "Jul": 285000,
      "Aug": 285000,
      "Sep": 285000
    }
  },
  {
    "market": "Mauritius",
    "businessUnit": "Brand",
    "campaign": "ABSA Proparco event",
    "medium": "Digital",
    "conversionRate": 0.39,
    "monthlySpend": {
      "Mar": 16992.5
    }
  },
  {
    "market": "Mauritius",
    "businessUnit": "RBB",
    "campaign": "ABSA Proparco event",
    "medium": "Print",
    "conversionRate": 0.39,
    "monthlySpend": {
      "Mar": 90750
    }
  },
  {
    "market": "Mauritius",
    "businessUnit": "RBB",
    "campaign": "Absa Wealth",
    "medium": "Digital",
    "conversionRate": 0.39,
    "monthlySpend": {
      "Mar": 303545.373
    }
  },
  {
    "market": "Mauritius",
    "businessUnit": "RBB",
    "campaign": "Absa Wealth",
    "medium": "OOH",
    "conversionRate": 0.39,
    "monthlySpend": {
      "Mar": 174610.83666666667,
      "Apr": 111996,
      "May": 310600
    }
  },
  {
    "market": "Mauritius",
    "businessUnit": "RBB",
    "campaign": "Absa Wealth",
    "medium": "Print",
    "conversionRate": 0.39,
    "monthlySpend": {
      "May": 262500,
      "Jun": 100000,
      "Jul": 35250
    }
  },
  {
    "market": "Mauritius",
    "businessUnit": "RBB",
    "campaign": "Absa Wealth",
    "medium": "DOOH",
    "conversionRate": 0.39,
    "monthlySpend": {
      "Jul": 400000,
      "Aug": 370000,
      "Sep": 370000
    }
  },
  {
    "market": "Mauritius",
    "businessUnit": "RBB",
    "campaign": "Winners Annoucement ",
    "medium": "Digital",
    "conversionRate": 0.39,
    "monthlySpend": {
      "May": 14565
    }
  },
  {
    "market": "Mauritius",
    "businessUnit": "RBB",
    "campaign": "Winners Annoucement ",
    "medium": "Print",
    "conversionRate": 0.39,
    "monthlySpend": {
      "May": 22320
    }
  },
  {
    "market": "Mauritius",
    "businessUnit": "RBB",
    "campaign": "ABSA Access",
    "medium": "Digital",
    "conversionRate": 0.39,
    "monthlySpend": {
      "Aug": 51793,
      "Sep": 263234
    }
  },
  {
    "market": "Mauritius",
    "businessUnit": "RBB",
    "campaign": "ABSA Access",
    "medium": "OOH",
    "conversionRate": 0.39,
    "monthlySpend": {
      "Aug": 62050,
      "Sep": 72467
    }
  },
  {
    "market": "Mauritius",
    "businessUnit": "RBB",
    "campaign": "ABSA Access",
    "medium": "Print",
    "conversionRate": 0.39,
    "monthlySpend": {
      "Aug": 23625,
      "Sep": 47250
    }
  },
  {
    "market": "Mauritius",
    "businessUnit": "RBB",
    "campaign": "ABSA Access",
    "medium": "DOOH",
    "conversionRate": 0.39,
    "monthlySpend": {
      "Aug": 111574,
      "Sep": 111574
    }
  },
  {
    "market": "Mauritius",
    "businessUnit": "RBB",
    "campaign": "ABSA Women Forward ",
    "medium": "Digital",
    "conversionRate": 0.39,
    "monthlySpend": {
      "Sep": 19420
    }
  },
  {
    "market": "Mauritius",
    "businessUnit": "RBB",
    "campaign": "ABSA Women Forward ",
    "medium": "Print",
    "conversionRate": 0.39,
    "monthlySpend": {
      "Sep": 100875
    }
  },
  {
    "market": "Mauritius",
    "businessUnit": "CIB",
    "campaign": "ABSA Video wall @ Aiport - Global Market/ CIB/Wealth",
    "medium": "DOOH",
    "conversionRate": 0.39,
    "monthlySpend": {
      "Sep": 345000
    }
  },
  {
    "market": "Mauritius",
    "businessUnit": "RBB",
    "campaign": "ABSA National Sensitization campaign ",
    "medium": "Digital",
    "conversionRate": 0.39,
    "monthlySpend": {
      "Sep": 180053
    }
  },
  {
    "market": "Mauritius",
    "businessUnit": "RBB",
    "campaign": "ABSA National Sensitization campaign ",
    "medium": "Radio",
    "conversionRate": 0.39,
    "monthlySpend": {
      "Sep": 10740
    }
  },
  {
    "market": "Mauritius",
    "businessUnit": "RBB",
    "campaign": "ABSA National Sensitization campaign ",
    "medium": "OOH",
    "conversionRate": 0.39,
    "monthlySpend": {
      "Sep": 198225
    }
  },
  {
    "market": "Mauritius",
    "businessUnit": "RBB",
    "campaign": "ABSA National Sensitization campaign ",
    "medium": "Print",
    "conversionRate": 0.39,
    "monthlySpend": {
      "Sep": 71025
    }
  },
  {
    "market": "Tanzania",
    "businessUnit": "RBB",
    "campaign": "GROUP SAVINGS ACCOUNT",
    "medium": "Digital",
    "conversionRate": 0.007,
    "monthlySpend": {
      "Feb": 2147983,
      "Mar": 2147983,
      "Apr": 2147983
    }
  },
  {
    "market": "Tanzania",
    "businessUnit": "RBB",
    "campaign": "GROUP SAVINGS ACCOUNT",
    "medium": "DOOH",
    "conversionRate": 0.007,
    "monthlySpend": {
      "Feb": 4657500,
      "Mar": 6210000
    }
  },
  {
    "market": "Tanzania",
    "businessUnit": "RBB",
    "campaign": "GROUP SAVINGS ACCOUNT",
    "medium": "Radio",
    "conversionRate": 0.007,
    "monthlySpend": {
      "Feb": 24500000,
      "Mar": 24500000
    }
  },
  {
    "market": "Tanzania",
    "businessUnit": "CIB",
    "campaign": "CIB ACCESS",
    "medium": "Digital",
    "conversionRate": 0.007,
    "monthlySpend": {
      "Mar": 7669648,
      "Apr": 7669648
    }
  },
  {
    "market": "Tanzania",
    "businessUnit": "CIB",
    "campaign": "CIB ACCESS",
    "medium": "DOOH",
    "conversionRate": 0.007,
    "monthlySpend": {
      "Mar": 21860000,
      "Apr": 11657500
    }
  },
  {
    "market": "Tanzania",
    "businessUnit": "RBB",
    "campaign": "INFINITE VISA CARD",
    "medium": "DOOH",
    "conversionRate": 0.007,
    "monthlySpend": {
      "Apr": 8820000,
      "May": 6210000,
      "Jun": 3500000
    }
  },
  {
    "market": "Tanzania",
    "businessUnit": "RBB",
    "campaign": "INFINITE VISA CARD",
    "medium": "Radio",
    "conversionRate": 0.007,
    "monthlySpend": {
      "Apr": 27800000,
      "May": 16000000,
      "Jun": 11800000
    }
  },
  {
    "market": "Tanzania",
    "businessUnit": "RBB",
    "campaign": "INFINITE VISA CARD",
    "medium": "Print",
    "conversionRate": 0.007,
    "monthlySpend": {
      "Apr": 11606500,
      "May": 820000,
      "Jun": 820000
    }
  },
  {
    "market": "Tanzania",
    "businessUnit": "Brand",
    "campaign": "BRAND CHAPTERS",
    "medium": "Digital",
    "conversionRate": 0.007,
    "monthlySpend": {}
  },
  {
    "market": "Tanzania",
    "businessUnit": "Brand",
    "campaign": "BRAND CHAPTERS",
    "medium": "DOOH",
    "conversionRate": 0.007,
    "monthlySpend": {
      "Sep": 17710000
    }
  },
  {
    "market": "Tanzania",
    "businessUnit": "Brand",
    "campaign": "BRAND CHAPTERS",
    "medium": "Radio",
    "conversionRate": 0.007,
    "monthlySpend": {
      "Sep": 22000000
    }
  },
  {
    "market": "Tanzania",
    "businessUnit": "Brand",
    "campaign": "BRAND CHAPTERS",
    "medium": "Print",
    "conversionRate": 0.007,
    "monthlySpend": {
      "Sep": 10100000
    }
  },
  {
    "market": "Tanzania",
    "businessUnit": "Brand",
    "campaign": "BRAND CHAPTERS",
    "medium": "Television",
    "conversionRate": 0.007,
    "monthlySpend": {
      "Sep": 4800000
    }
  },
  {
    "market": "Tanzania",
    "businessUnit": "Brand",
    "campaign": "BRAND CHAPTERS",
    "medium": "Podcast",
    "conversionRate": 0.007,
    "monthlySpend": {}
  },
  {
    "market": "Tanzania",
    "businessUnit": "RBB",
    "campaign": "PLAY YOUR CARDS RIGHT",
    "medium": "Digital",
    "conversionRate": 0.007,
    "monthlySpend": {}
  },
  {
    "market": "Tanzania",
    "businessUnit": "RBB",
    "campaign": "PLAY YOUR CARDS RIGHT",
    "medium": "DOOH",
    "conversionRate": 0.007,
    "monthlySpend": {
      "Sep": 11710000
    }
  },
  {
    "market": "Tanzania",
    "businessUnit": "RBB",
    "campaign": "PLAY YOUR CARDS RIGHT",
    "medium": "Radio",
    "conversionRate": 0.007,
    "monthlySpend": {
      "Sep": 43500000
    }
  },
  {
    "market": "Tanzania",
    "businessUnit": "RBB",
    "campaign": "PLAY YOUR CARDS RIGHT",
    "medium": "Influencers",
    "conversionRate": 0.007,
    "monthlySpend": {
      "Sep": 3500000
    }
  },
  {
    "market": "Zambia",
    "businessUnit": "RBB",
    "campaign": "Premier Banking",
    "medium": "Digital",
    "conversionRate": 0.76,
    "monthlySpend": {
      "Jan": 23000
    }
  },
  {
    "market": "Zambia",
    "businessUnit": "RBB",
    "campaign": "Retail Unsecured Loans ",
    "medium": "Television",
    "conversionRate": 0.76,
    "monthlySpend": {
      "Jan": 450000,
      "Feb": 450000,
      "May": 225000,
      "Jun": 450000
    }
  },
  {
    "market": "Zambia",
    "businessUnit": "Brand",
    "campaign": "Your Story Matters ",
    "medium": "Radio",
    "conversionRate": 0.76,
    "monthlySpend": {
      "Jan": 108000
    }
  },
  {
    "market": "Zambia",
    "businessUnit": "Brand",
    "campaign": "Your Story Matters ",
    "medium": "OOH",
    "conversionRate": 0.76,
    "monthlySpend": {
      "Jan": 102037,
      "Feb": 102037,
      "Mar": 102037,
      "Apr": 102037,
      "May": 102037,
      "Jun": 102037,
      "Jul": 102037,
      "Aug": 102037,
      "Sep": 102037,
      "Oct": 102037
    }
  },
  {
    "market": "Zambia",
    "businessUnit": "BB",
    "campaign": "Women in Business",
    "medium": "Digital",
    "conversionRate": 0.76,
    "monthlySpend": {
      "Mar": 143446,
      "Jul": 15000,
      "Aug": 15000,
      "Sep": 15000,
      "Oct": 15000
    }
  },
  {
    "market": "Zambia",
    "businessUnit": "BB",
    "campaign": "Women in Business",
    "medium": "DOOH",
    "conversionRate": 0.76,
    "monthlySpend": {
      "Apr": 205319
    }
  },
  {
    "market": "Zambia",
    "businessUnit": "BB",
    "campaign": "Women in Business",
    "medium": "Radio",
    "conversionRate": 0.76,
    "monthlySpend": {
      "Mar": 49231
    }
  },
  {
    "market": "Zambia",
    "businessUnit": "BB",
    "campaign": "Women in Business",
    "medium": "OOH",
    "conversionRate": 0.76,
    "monthlySpend": {
      "Mar": 89000
    }
  },
  {
    "market": "Zambia",
    "businessUnit": "Brand",
    "campaign": "Absa Marathon ",
    "medium": "Television",
    "conversionRate": 0.76,
    "monthlySpend": {
      "Jul": 225000,
      "Aug": 225000,
      "Sep": 225000
    }
  },
  {
    "market": "Zambia",
    "businessUnit": "Brand",
    "campaign": "Absa Marathon ",
    "medium": "Digital",
    "conversionRate": 0.76,
    "monthlySpend": {
      "Jan": 1305,
      "Jul": 20000,
      "Aug": 35000,
      "Sep": 35000
    }
  },
  {
    "market": "Zambia",
    "businessUnit": "Brand",
    "campaign": "Absa Marathon ",
    "medium": "Radio",
    "conversionRate": 0.76,
    "monthlySpend": {
      "Jul": 113847,
      "Aug": 113847,
      "Sep": 113847
    }
  },
  {
    "market": "Zambia",
    "businessUnit": "Brand",
    "campaign": "Absa Marathon ",
    "medium": "Print",
    "conversionRate": 0.76,
    "monthlySpend": {
      "Sep": 35000
    }
  },
  {
    "market": "Zambia",
    "businessUnit": "BB",
    "campaign": "Momo on POS",
    "medium": "Television",
    "conversionRate": 0.76,
    "monthlySpend": {
      "Jun": 76560,
      "Jul": 130000,
      "Aug": 130000
    }
  },
  {
    "market": "Zambia",
    "businessUnit": "BB",
    "campaign": "Momo on POS",
    "medium": "Digital",
    "conversionRate": 0.76,
    "monthlySpend": {
      "Jun": 56000,
      "Jul": 40000,
      "Aug": 40000
    }
  },
  {
    "market": "Zambia",
    "businessUnit": "BB",
    "campaign": "Momo on POS",
    "medium": "DOOH",
    "conversionRate": 0.76,
    "monthlySpend": {
      "Feb": 205319,
      "Jun": 69000,
      "Jul": 69000,
      "Aug": 69000
    }
  },
  {
    "market": "Zambia",
    "businessUnit": "BB",
    "campaign": "Momo on POS",
    "medium": "Radio",
    "conversionRate": 0.76,
    "monthlySpend": {
      "Feb": 427694.67,
      "May": 427694.67
    }
  },
  {
    "market": "Zambia",
    "businessUnit": "BB",
    "campaign": "Momo on POS",
    "medium": "OOH",
    "conversionRate": 0.76,
    "monthlySpend": {
      "Feb": 191354,
      "Jun": 70000,
      "Jul": 70000,
      "Aug": 70000,
      "Sep": 70000
    }
  },
  {
    "market": "Zambia",
    "businessUnit": "BB",
    "campaign": "Momo on POS",
    "medium": "Print",
    "conversionRate": 0.76,
    "monthlySpend": {
      "Feb": 80000
    }
  },
  {
    "market": "Zambia",
    "businessUnit": "RBB",
    "campaign": "Other - Financial Statements and MRP",
    "medium": "Print",
    "conversionRate": 0.76,
    "monthlySpend": {
      "Feb": 60800,
      "Mar": 67000,
      "Apr": 134000,
      "May": 124000
    }
  },
  {
    "market": "Zambia",
    "businessUnit": "Brand",
    "campaign": "ABSA Cup ",
    "medium": "Television",
    "conversionRate": 0.76,
    "monthlySpend": {
      "Mar": 450000,
      "Apr": 450000,
      "May": 225000
    }
  },
  {
    "market": "Zambia",
    "businessUnit": "Brand",
    "campaign": "ABSA Cup ",
    "medium": "Digital",
    "conversionRate": 0.76,
    "monthlySpend": {
      "Apr": 210300,
      "May": 8700
    }
  },
  {
    "market": "Zambia",
    "businessUnit": "Brand",
    "campaign": "ABSA Cup ",
    "medium": "DOOH",
    "conversionRate": 0.76,
    "monthlySpend": {
      "Mar": 205319,
      "May": 162000
    }
  },
  {
    "market": "Zambia",
    "businessUnit": "Brand",
    "campaign": "ABSA Cup ",
    "medium": "Radio",
    "conversionRate": 0.76,
    "monthlySpend": {
      "Mar": 427694.67,
      "Apr": 427694.67
    }
  },
  {
    "market": "Zambia",
    "businessUnit": "Brand",
    "campaign": "ABSA Cup ",
    "medium": "OOH",
    "conversionRate": 0.76,
    "monthlySpend": {
      "Mar": 93680,
      "Apr": 46840,
      "May": 46840
    }
  },
  {
    "market": "Zambia",
    "businessUnit": "RBB",
    "campaign": "Infinity Card",
    "medium": "OOH",
    "conversionRate": 0.76,
    "monthlySpend": {
      "Mar": 94500,
      "Apr": 62000,
      "May": 62000,
      "Jun": 62000,
      "Jul": 62000,
      "Aug": 62000,
      "Sep": 62000
    }
  },
  {
    "market": "Zambia",
    "businessUnit": "BB",
    "campaign": "Inspire Me Conference - Women in Business",
    "medium": "Digital",
    "conversionRate": 0.76,
    "monthlySpend": {
      "Jun": 160000,
      "Jul": 160000
    }
  },
  {
    "market": "Zambia",
    "businessUnit": "BB",
    "campaign": "Inspire Me Conference - Women in Business",
    "medium": "DOOH",
    "conversionRate": 0.76,
    "monthlySpend": {
      "Jun": 62000
    }
  },
  {
    "market": "Zambia",
    "businessUnit": "BB",
    "campaign": "Inspire Me Conference - Women in Business",
    "medium": "Radio",
    "conversionRate": 0.76,
    "monthlySpend": {}
  },
  {
    "market": "Zambia",
    "businessUnit": "BB",
    "campaign": "Inspire Me Conference - Women in Business",
    "medium": "OOH",
    "conversionRate": 0.76,
    "monthlySpend": {
      "Jun": 40900,
      "Jul": 40900
    }
  },
  {
    "market": "Zambia",
    "businessUnit": "BB",
    "campaign": "Inspire Me Conference - Women in Business",
    "medium": "Print",
    "conversionRate": 0.76,
    "monthlySpend": {
      "Jul": 80000
    }
  },
  {
    "market": "Zambia",
    "businessUnit": "RBB",
    "campaign": "Swipe and Win ",
    "medium": "Digital",
    "conversionRate": 0.76,
    "monthlySpend": {
      "Jun": 62600,
      "Jul": 62600,
      "Aug": 75600,
      "Sep": 62600,
      "Oct": 62600,
      "Nov": 62600,
      "Dec": 62600
    }
  },
  {
    "market": "Zambia",
    "businessUnit": "RBB",
    "campaign": "Swipe and Win ",
    "medium": "DOOH",
    "conversionRate": 0.76,
    "monthlySpend": {
      "Jun": 62000,
      "Jul": 62000,
      "Aug": 62000,
      "Sep": 62600,
      "Oct": 62000,
      "Nov": 62000,
      "Dec": 62000
    }
  },
  {
    "market": "Zambia",
    "businessUnit": "RBB",
    "campaign": "Swipe and Win ",
    "medium": "Television",
    "conversionRate": 0.76,
    "monthlySpend": {
      "Aug": 225000
    }
  },
  {
    "market": "Zambia",
    "businessUnit": "RBB",
    "campaign": "Swipe and Win ",
    "medium": "Radio",
    "conversionRate": 0.76,
    "monthlySpend": {
      "Jun": 213847,
      "Jul": 113847,
      "Aug": 103000,
      "Sep": 213847,
      "Oct": 213847,
      "Nov": 213847,
      "Dec": 213847
    }
  },
  {
    "market": "Zambia",
    "businessUnit": "RBB",
    "campaign": "Swipe and Win ",
    "medium": "OOH",
    "conversionRate": 0.76,
    "monthlySpend": {
      "Jun": 85700,
      "Jul": 85700,
      "Aug": 85700,
      "Sep": 85700
    }
  },
  {
    "market": "Zambia",
    "businessUnit": "RBB",
    "campaign": "Ulitamte Plus Account ",
    "medium": "Radio",
    "conversionRate": 0.76,
    "monthlySpend": {
      "Jun": 213847,
      "Jul": 106923.5
    }
  },
  {
    "market": "Zambia",
    "businessUnit": "RBB",
    "campaign": "Salary Advance",
    "medium": "Radio",
    "conversionRate": 0.76,
    "monthlySpend": {
      "Jul": 150000,
      "Aug": 106923.5,
      "Sep": 140000,
      "Oct": 140000,
      "Nov": 140000
    }
  },
  {
    "market": "Zambia",
    "businessUnit": "RBB",
    "campaign": "Salary Advance",
    "medium": "Television",
    "conversionRate": 0.76,
    "monthlySpend": {
      "Sep": 225000,
      "Oct": 450000
    }
  },
  {
    "market": "Zambia",
    "businessUnit": "RBB",
    "campaign": "Salary Advance",
    "medium": "Digital",
    "conversionRate": 0.76,
    "monthlySpend": {
      "Sep": 43000,
      "Oct": 43000
    }
  },
  {
    "market": "Zambia",
    "businessUnit": "BB",
    "campaign": "Mobi Tap",
    "medium": "Television",
    "conversionRate": 0.76,
    "monthlySpend": {
      "Sep": 45000
    }
  },
  {
    "market": "Zambia",
    "businessUnit": "BB",
    "campaign": "Mobi Tap",
    "medium": "Radio",
    "conversionRate": 0.76,
    "monthlySpend": {
      "Sep": 140000,
      "Oct": 140000,
      "Nov": 140000
    }
  },
  {
    "market": "Zambia",
    "businessUnit": "BB",
    "campaign": "Mobi Tap",
    "medium": "DOOH",
    "conversionRate": 0.76,
    "monthlySpend": {
      "Sep": 62000
    }
  },
  {
    "market": "Zambia",
    "businessUnit": "BB",
    "campaign": "Mobi Tap",
    "medium": "Digital",
    "conversionRate": 0.76,
    "monthlySpend": {
      "Sep": 52000
    }
  },
  {
    "market": "Uganda",
    "businessUnit": "RBB",
    "campaign": "Jooga 2025 Campaign",
    "medium": "Television",
    "conversionRate": 0.005,
    "monthlySpend": {
      "Jan": 28000000,
      "Feb": 28000000,
      "Mar": 28000000,
      "Apr": 28000000,
      "May": 56000000,
      "Jun": 56000000,
      "Jul": 56000000,
      "Aug": 56000000,
      "Sep": 56000000
    }
  },
  {
    "market": "Uganda",
    "businessUnit": "RBB",
    "campaign": "Jooga 2025 Campaign",
    "medium": "Digital",
    "conversionRate": 0.005,
    "monthlySpend": {
      "Mar": 26872160,
      "Apr": 84239909,
      "May": 17321188,
      "Jun": 20150496.555
    }
  },
  {
    "market": "Uganda",
    "businessUnit": "RBB",
    "campaign": "Jooga 2025 Campaign",
    "medium": "Radio",
    "conversionRate": 0.005,
    "monthlySpend": {
      "Jan": 60199999.99999999,
      "Feb": 54720000,
      "Mar": 36500000,
      "Apr": 80950000,
      "May": 80250000
    }
  },
  {
    "market": "Uganda",
    "businessUnit": "RBB",
    "campaign": "Jooga 2025 Campaign",
    "medium": "OOH",
    "conversionRate": 0.005,
    "monthlySpend": {
      "Jan": 7000000,
      "Feb": 5600000,
      "Mar": 6020000,
      "Apr": 7000000,
      "May": 7000000
    }
  },
  {
    "market": "Uganda",
    "businessUnit": "RBB",
    "campaign": "Jooga 2025 Campaign",
    "medium": "Print",
    "conversionRate": 0.005,
    "monthlySpend": {
      "Jan": 6802490,
      "Feb": 6752208,
      "Mar": 6752208,
      "Apr": 6752208
    }
  },
  {
    "market": "Uganda",
    "businessUnit": "RBB",
    "campaign": "7 Hills 2025 Campaign",
    "medium": "Television",
    "conversionRate": 0.005,
    "monthlySpend": {
      "Mar": 24000000
    }
  },
  {
    "market": "Uganda",
    "businessUnit": "RBB",
    "campaign": "7 Hills 2025 Campaign",
    "medium": "Digital",
    "conversionRate": 0.005,
    "monthlySpend": {
      "Feb": 65342554,
      "Mar": 100366617
    }
  },
  {
    "market": "Uganda",
    "businessUnit": "RBB",
    "campaign": "7 Hills 2025 Campaign",
    "medium": "Radio",
    "conversionRate": 0.005,
    "monthlySpend": {
      "Feb": 27360000,
      "Mar": 42872000
    }
  },
  {
    "market": "Uganda",
    "businessUnit": "RBB",
    "campaign": "7 Hills 2025 Campaign",
    "medium": "DOOH",
    "conversionRate": 0.005,
    "monthlySpend": {
      "Feb": 2800000,
      "Mar": 2100000
    }
  },
  {
    "market": "Uganda",
    "businessUnit": "RBB",
    "campaign": "PLAY YOUR CARDS RIGHT",
    "medium": "Digital",
    "conversionRate": 0.005,
    "monthlySpend": {
      "Jun": 16043648.28,
      "Jul": 9471996
    }
  },
  {
    "market": "Uganda",
    "businessUnit": "RBB",
    "campaign": "PLAY YOUR CARDS RIGHT",
    "medium": "Radio",
    "conversionRate": 0.005,
    "monthlySpend": {
      "Jun": 52200000,
      "Jul": 31150000,
      "Aug": 31150000
    }
  },
  {
    "market": "Uganda",
    "businessUnit": "RBB",
    "campaign": "PLAY YOUR CARDS RIGHT",
    "medium": "DOOH",
    "conversionRate": 0.005,
    "monthlySpend": {
      "Jun": 7000000,
      "Jul": 7000000,
      "Aug": 7000000
    }
  },
  {
    "market": "Uganda",
    "businessUnit": "RBB",
    "campaign": "PLAY YOUR CARDS RIGHT",
    "medium": "Print",
    "conversionRate": 0.005,
    "monthlySpend": {
      "Jun": 11487031
    }
  },
  {
    "market": "Uganda",
    "businessUnit": "RBB",
    "campaign": "TRADE FINANCE",
    "medium": "Television",
    "conversionRate": 0.005,
    "monthlySpend": {
      "Jan": 28000000,
      "Feb": 28000000,
      "Mar": 28000000,
      "Apr": 28000000
    }
  },
  {
    "market": "Uganda",
    "businessUnit": "RBB",
    "campaign": "TRADE FINANCE",
    "medium": "Digital",
    "conversionRate": 0.005,
    "monthlySpend": {
      "Mar": 12635151
    }
  },
  {
    "market": "Uganda",
    "businessUnit": "RBB",
    "campaign": "TRADE FINANCE",
    "medium": "Radio",
    "conversionRate": 0.005,
    "monthlySpend": {
      "Jan": 25800000,
      "Feb": 9120000,
      "Mar": 13980000,
      "Apr": 6750000,
      "May": 6750000
    }
  },
  {
    "market": "Uganda",
    "businessUnit": "RBB",
    "campaign": "TRADE FINANCE",
    "medium": "DOOH",
    "conversionRate": 0.005,
    "monthlySpend": {
      "Jan": 7000000,
      "Feb": 5600000,
      "Mar": 5880000,
      "Apr": 7000000,
      "May": 7000000
    }
  },
  {
    "market": "Uganda",
    "businessUnit": "RBB",
    "campaign": "TRADE FINANCE",
    "medium": "Print",
    "conversionRate": 0.005,
    "monthlySpend": {
      "Jan": 54163510,
      "Feb": 40664095,
      "Mar": 12199228
    }
  },
  {
    "market": "Uganda",
    "businessUnit": "RBB",
    "campaign": "ABSA ACCESS",
    "medium": "Digital",
    "conversionRate": 0.005,
    "monthlySpend": {
      "Jun": 6973515.47,
      "Jul": 3967200
    }
  },
  {
    "market": "Uganda",
    "businessUnit": "RBB",
    "campaign": "ABSA ACCESS",
    "medium": "DOOH",
    "conversionRate": 0.005,
    "monthlySpend": {
      "Jul": 1400000,
      "Aug": 1400000
    }
  },
  {
    "market": "Uganda",
    "businessUnit": "RBB",
    "campaign": "POST BUDGET DIALOGUE",
    "medium": "Television",
    "conversionRate": 0.005,
    "monthlySpend": {
      "Jun": 40000000
    }
  },
  {
    "market": "Uganda",
    "businessUnit": "RBB",
    "campaign": "DIGILOAN",
    "medium": "Digital",
    "conversionRate": 0.005,
    "monthlySpend": {
      "Jun": 15282305.17
    }
  },
  {
    "market": "Uganda",
    "businessUnit": "RBB",
    "campaign": "DIGILOAN",
    "medium": "Radio",
    "conversionRate": 0.005,
    "monthlySpend": {
      "Jun": 34800000,
      "Jul": 13350000,
      "Aug": 13350000,
      "Sep": 42000000
    }
  },
  {
    "market": "Uganda",
    "businessUnit": "RBB",
    "campaign": "DIGILOAN",
    "medium": "DOOH",
    "conversionRate": 0.005,
    "monthlySpend": {
      "Jun": 7000000,
      "Jul": 5600000,
      "Aug": 5600000,
      "Sep": 1500000
    }
  },
  {
    "market": "Uganda",
    "businessUnit": "RBB",
    "campaign": "SEO SEARCH ENGINE - MULTI CAMPAIGN",
    "medium": "Digital",
    "conversionRate": 0.005,
    "monthlySpend": {
      "Aug": 4846788,
      "Sep": 720000
    }
  },
  {
    "market": "Uganda",
    "businessUnit": "RBB",
    "campaign": "Business Club",
    "medium": "DOOH",
    "conversionRate": 0.005,
    "monthlySpend": {
      "Sep": 8500000
    }
  },
  {
    "market": "Uganda",
    "businessUnit": "RBB",
    "campaign": "Business Club",
    "medium": "Print",
    "conversionRate": 0.005,
    "monthlySpend": {
      "Sep": 6372881
    }
  },
  {
    "market": "Uganda",
    "businessUnit": "RBB",
    "campaign": "Cash Management",
    "medium": "DOOH",
    "conversionRate": 0.005,
    "monthlySpend": {
      "Sep": 4000000
    }
  },
  {
    "market": "Uganda",
    "businessUnit": "RBB",
    "campaign": "Cash Management",
    "medium": "Print",
    "conversionRate": 0.005,
    "monthlySpend": {
      "Sep": 6372881
    }
  },
  {
    "market": "Seychelles",
    "businessUnit": "RBB",
    "campaign": "Brand Positioning",
    "medium": "DOOH",
    "conversionRate": 1.2107,
    "monthlySpend": {
      "Jan": 9000
    }
  },
  {
    "market": "Seychelles",
    "businessUnit": "RBB",
    "campaign": "Brand Positioning",
    "medium": "OOH",
    "conversionRate": 1.2107,
    "monthlySpend": {
      "Jan": 123460
    }
  },
  {
    "market": "Seychelles",
    "businessUnit": "RBB",
    "campaign": "Brand Positioning",
    "medium": "Digital",
    "conversionRate": 1.2107,
    "monthlySpend": {
      "Jan": 9200
    }
  },
  {
    "market": "Seychelles",
    "businessUnit": "RBB",
    "campaign": "VAF CAR LOAN",
    "medium": "DOOH",
    "conversionRate": 1.2107,
    "monthlySpend": {
      "Jan": 9000
    }
  },
  {
    "market": "Seychelles",
    "businessUnit": "RBB",
    "campaign": "VAF CAR LOAN",
    "medium": "OOH",
    "conversionRate": 1.2107,
    "monthlySpend": {
      "Jan": 120517
    }
  },
  {
    "market": "Seychelles",
    "businessUnit": "RBB",
    "campaign": "MOBI TOP ",
    "medium": "Radio",
    "conversionRate": 1.2107,
    "monthlySpend": {
      "Jan": 59083
    }
  },
  {
    "market": "Seychelles",
    "businessUnit": "RBB",
    "campaign": "MOBI TOP ",
    "medium": "DOOH",
    "conversionRate": 1.2107,
    "monthlySpend": {
      "Jan": 9000
    }
  },
  {
    "market": "Seychelles",
    "businessUnit": "RBB",
    "campaign": "MOBI TOP ",
    "medium": "OOH",
    "conversionRate": 1.2107,
    "monthlySpend": {
      "Jan": 81917
    }
  },
  {
    "market": "Seychelles",
    "businessUnit": "RBB",
    "campaign": "PREMIER BANKING CVP",
    "medium": "Print",
    "conversionRate": 1.2107,
    "monthlySpend": {
      "Jan": 5520
    }
  },
  {
    "market": "Seychelles",
    "businessUnit": "RBB",
    "campaign": "PREMIER BANKING CVP",
    "medium": "DOOH",
    "conversionRate": 1.2107,
    "monthlySpend": {
      "Jan": 16000
    }
  },
  {
    "market": "Seychelles",
    "businessUnit": "RBB",
    "campaign": "PREMIER BANKING CVP",
    "medium": "Digital",
    "conversionRate": 1.2107,
    "monthlySpend": {
      "Jan": 13100
    }
  },
  {
    "market": "Seychelles",
    "businessUnit": "RBB",
    "campaign": "FESTIVE CARD",
    "medium": "DOOH",
    "conversionRate": 1.2107,
    "monthlySpend": {
      "Jan": 13000
    }
  },
  {
    "market": "Seychelles",
    "businessUnit": "RBB",
    "campaign": "FESTIVE CARD",
    "medium": "Digital",
    "conversionRate": 1.2107,
    "monthlySpend": {
      "Jan": 13100
    }
  },
  {
    "market": "Seychelles",
    "businessUnit": "RBB",
    "campaign": "SIGNATURE CARD",
    "medium": "Print",
    "conversionRate": 1.2107,
    "monthlySpend": {
      "Jan": 12416
    }
  },
  {
    "market": "Seychelles",
    "businessUnit": "RBB",
    "campaign": "SIGNATURE CARD",
    "medium": "DOOH",
    "conversionRate": 1.2107,
    "monthlySpend": {
      "Jan": 30055
    }
  },
  {
    "market": "Seychelles",
    "businessUnit": "RBB",
    "campaign": "SIGNATURE CARD",
    "medium": "Digital",
    "conversionRate": 1.2107,
    "monthlySpend": {
      "Jan": 50450
    }
  },
  {
    "market": "Seychelles",
    "businessUnit": "RBB",
    "campaign": "FIXED DEPOSIT",
    "medium": "Television",
    "conversionRate": 1.2107,
    "monthlySpend": {
      "Jan": 18840
    }
  },
  {
    "market": "Seychelles",
    "businessUnit": "RBB",
    "campaign": "FIXED DEPOSIT",
    "medium": "Radio",
    "conversionRate": 1.2107,
    "monthlySpend": {
      "Jan": 45945
    }
  },
  {
    "market": "Seychelles",
    "businessUnit": "RBB",
    "campaign": "FIXED DEPOSIT",
    "medium": "Print",
    "conversionRate": 1.2107,
    "monthlySpend": {
      "Jan": 22580
    }
  },
  {
    "market": "Seychelles",
    "businessUnit": "RBB",
    "campaign": "FIXED DEPOSIT",
    "medium": "DOOH",
    "conversionRate": 1.2107,
    "monthlySpend": {
      "Jan": 17811
    }
  },
  {
    "market": "Seychelles",
    "businessUnit": "RBB",
    "campaign": "FIXED DEPOSIT",
    "medium": "Digital",
    "conversionRate": 1.2107,
    "monthlySpend": {
      "Jan": 47280
    }
  },
  {
    "market": "Seychelles",
    "businessUnit": "RBB",
    "campaign": "BUSINESS CREDIT CARD",
    "medium": "Radio",
    "conversionRate": 1.2107,
    "monthlySpend": {
      "Jan": 45945
    }
  },
  {
    "market": "Seychelles",
    "businessUnit": "RBB",
    "campaign": "BUSINESS CREDIT CARD",
    "medium": "Print",
    "conversionRate": 1.2107,
    "monthlySpend": {
      "Jan": 25392
    }
  },
  {
    "market": "Seychelles",
    "businessUnit": "RBB",
    "campaign": "BUSINESS CREDIT CARD",
    "medium": "DOOH",
    "conversionRate": 1.2107,
    "monthlySpend": {
      "Jan": 19622
    }
  },
  {
    "market": "Seychelles",
    "businessUnit": "RBB",
    "campaign": "BUSINESS CREDIT CARD",
    "medium": "Digital",
    "conversionRate": 1.2107,
    "monthlySpend": {
      "Jan": 17360
    }
  },
  {
    "market": "Mozambique",
    "businessUnit": "Brand",
    "campaign": "Repositioning Campaign",
    "medium": "Digital",
    "conversionRate": 0.28,
    "monthlySpend": {
      "Jan": 566629.75,
      "Feb": 681175.75,
      "Mar": 681175.75,
      "Apr": 949123.75,
      "May": 663617,
      "Jun": 854579.52,
      "Jul": 788828.48,
      "Aug": 788828.48,
      "Sep": 229955.01
    }
  },
  {
    "market": "Mozambique",
    "businessUnit": "Brand",
    "campaign": "Repositioning Campaign",
    "medium": "Radio",
    "conversionRate": 0.28,
    "monthlySpend": {
      "Feb": 44172,
      "May": 226311,
      "Jun": null
    }
  },
  {
    "market": "Mozambique",
    "businessUnit": "Brand",
    "campaign": "Repositioning Campaign",
    "medium": "OOH",
    "conversionRate": 0.28,
    "monthlySpend": {
      "Jan": 513000,
      "Feb": 873875,
      "Mar": 1062237,
      "Apr": 1588829,
      "May": 1588829,
      "Jun": 1065853.25,
      "Jul": 1559596.08,
      "Aug": 1395022,
      "Sep": 1106689.8
    }
  },
  {
    "market": "Mozambique",
    "businessUnit": "Brand",
    "campaign": "Repositioning Campaign",
    "medium": "DOOH",
    "conversionRate": 0.28,
    "monthlySpend": {
      "Jan": 267337.6,
      "Feb": 267337.6,
      "Mar": 338021,
      "Apr": 665239,
      "May": 327218,
      "Jun": 1007825.86,
      "Jul": 551385.92,
      "Aug": 551385.92,
      "Sep": 506057.33
    }
  },
  {
    "market": "Mozambique",
    "businessUnit": "Brand",
    "campaign": "Repositioning Campaign",
    "medium": "Print",
    "conversionRate": 0.28,
    "monthlySpend": {
      "Jan": 334400,
      "Feb": 150128,
      "Mar": 150128,
      "Apr": 387219.2,
      "May": 317798.2,
      "Jun": 422114.69,
      "Aug": 605598,
      "Sep": 189270
    }
  },
  {
    "market": "Mozambique",
    "businessUnit": "Brand",
    "campaign": "Repositioning Campaign",
    "medium": "Other",
    "conversionRate": 0.28,
    "monthlySpend": {
      "Feb": 862465,
      "Mar": 862465,
      "Jun": null
    }
  },
  {
    "market": "Mozambique",
    "businessUnit": "RBB",
    "campaign": "Canais Digitais",
    "medium": "Digital",
    "conversionRate": 0.28,
    "monthlySpend": {
      "Sep": 23727.99
    }
  },
  {
    "market": "Mozambique",
    "businessUnit": "RBB",
    "campaign": "Canais Digitais",
    "medium": "Digital",
    "conversionRate": 0.28,
    "monthlySpend": {
      "Sep": 90484.32
    }
  },
  {
    "market": "Mozambique",
    "businessUnit": "RBB",
    "campaign": "Canais Digitais",
    "medium": "Digital",
    "conversionRate": 0.28,
    "monthlySpend": {
      "Sep": 69619.05
    }
  },
  {
    "market": "Mozambique",
    "businessUnit": "RBB",
    "campaign": "Credit Consumer",
    "medium": "Digital",
    "conversionRate": 0.28,
    "monthlySpend": {
      "Sep": 552.1
    }
  },
  {
    "market": "Mozambique",
    "businessUnit": "RBB",
    "campaign": "Credit Consumer",
    "medium": "Digital",
    "conversionRate": 0.28,
    "monthlySpend": {
      "Sep": 2366.85
    }
  },
  {
    "market": "Mozambique",
    "businessUnit": "RBB",
    "campaign": "Promoted Content",
    "medium": "Digital",
    "conversionRate": 0.28,
    "monthlySpend": {
      "Sep": 17362.27
    }
  },
  {
    "market": "Mozambique",
    "businessUnit": "RBB",
    "campaign": "Promoted Content",
    "medium": "Digital",
    "conversionRate": 0.28,
    "monthlySpend": {
      "Sep": 25842.43
    }
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
