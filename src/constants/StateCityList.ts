interface ListData {
    Error: string;
    Status: string;
    MESSAGE: string;
    DataDetails?: null;
    TotalCount?: number;
}

interface StateListDataRecord {
    id: string | number;
    name: string;
}

interface CityListDataRecord {
    id: string | number;
    name: string;
    stateid: number;
}

interface StateList extends ListData {
    CircleList: StateListDataRecord[];
}

export interface CityList extends ListData {
    DataRecord: CityListDataRecord[];
}

interface StateCityListInterface {
    STATE_LIST: StateList;
    CITY_LIST: CityList;
}

export const STATE_CITY_LIST: StateCityListInterface = {
    STATE_LIST: {
        Error: '0',
        Status: '1',
        MESSAGE: 'SUCCESS',
        CircleList: [
            {
                id: 1,
                name: 'Andaman and Nicobar Islands',
            },
            {
                id: 2,
                name: 'Andhra Pradesh',
            },
            {
                id: 3,
                name: 'Arunachal Pradesh',
            },
            {
                id: 4,
                name: 'Assam',
            },
            {
                id: 5,
                name: 'Bihar',
            },
            {
                id: 6,
                name: 'Chandigarh',
            },
            {
                id: 7,
                name: 'Chhattisgarh',
            },
            {
                id: 8,
                name: 'Dadra and Nagar Haveli and Daman and Diu',
            },
            {
                id: 9,
                name: 'National Capital Territory of Delhi',
            },
            {
                id: 10,
                name: 'Goa',
            },
            {
                id: 11,
                name: 'Gujarat',
            },
            {
                id: 12,
                name: 'Haryana',
            },
            {
                id: 13,
                name: 'Himachal Pradesh',
            },
            {
                id: 14,
                name: 'Jammu and Kashmir',
            },
            {
                id: 15,
                name: 'Jharkhand',
            },
            {
                id: 16,
                name: 'Karnataka',
            },
            {
                id: 17,
                name: 'Kerala',
            },
            {
                id: 18,
                name: 'Ladakh',
            },
            {
                id: 19,
                name: 'Lakshadweep',
            },
            {
                id: 20,
                name: 'Madhya Pradesh',
            },
            {
                id: 21,
                name: 'Maharashtra',
            },
            {
                id: 22,
                name: 'Manipur',
            },
            {
                id: 23,
                name: 'Meghalaya',
            },
            {
                id: 24,
                name: 'Mizoram',
            },
            {
                id: 25,
                name: 'Nagaland',
            },
            {
                id: 26,
                name: 'Odisha',
            },
            {
                id: 27,
                name: 'Puducherry',
            },
            {
                id: 28,
                name: 'Punjab',
            },
            {
                id: 29,
                name: 'Rajasthan',
            },
            {
                id: 30,
                name: 'Sikkim',
            },
            {
                id: 31,
                name: 'Tamil Nadu',
            },
            {
                id: 32,
                name: 'Telangana',
            },
            {
                id: 33,
                name: 'Tripura',
            },
            {
                id: 34,
                name: 'Uttar Pradesh',
            },
            {
                id: 35,
                name: 'Uttarakhand',
            },
            {
                id: 36,
                name: 'West Bengal',
            },
            {
                id: 37,
                name: 'Pan India',
            },
        ],
    },
    CITY_LIST: {
        Error: '0',
        Status: '1',
        MESSAGE: 'SUCCESS',
        DataRecord: [
            {
                id: 1,
                name: 'SOUTH ANDAMAN',
                stateid: 1,
            },
            {
                id: 2,
                name: 'NICOBAR',
                stateid: 1,
            },
            {
                id: 3,
                name: 'NORTH AND MIDDLE ANDAMAN',
                stateid: 1,
            },
            {
                id: 4,
                name: 'MAHABUB NAGAR',
                stateid: 2,
            },
            {
                id: 5,
                name: 'ANANTHAPUR',
                stateid: 2,
            },
            {
                id: 6,
                name: 'CUDDAPAH',
                stateid: 2,
            },
            {
                id: 7,
                name: 'CHITTOOR',
                stateid: 2,
            },
            {
                id: 8,
                name: 'KURNOOL',
                stateid: 2,
            },
            {
                id: 9,
                name: 'PRAKASAM',
                stateid: 2,
            },
            {
                id: 10,
                name: 'WEST GODAVARI',
                stateid: 2,
            },
            {
                id: 11,
                name: 'KRISHNA',
                stateid: 2,
            },
            {
                id: 12,
                name: 'NELLORE',
                stateid: 2,
            },
            {
                id: 13,
                name: 'GUNTUR',
                stateid: 2,
            },
            {
                id: 14,
                name: 'EAST GODAVARI',
                stateid: 2,
            },
            {
                id: 15,
                name: 'VISAKHAPATNAM',
                stateid: 2,
            },
            {
                id: 16,
                name: 'VIZIANAGARAM',
                stateid: 2,
            },
            {
                id: 17,
                name: 'SRIKAKULAM',
                stateid: 2,
            },
            {
                id: 18,
                name: 'LOWER DIBANG VALLEY',
                stateid: 3,
            },
            {
                id: 19,
                name: 'DIBANG VALLEY',
                stateid: 3,
            },
            {
                id: 20,
                name: 'EAST KAMENG',
                stateid: 3,
            },
            {
                id: 21,
                name: 'EAST SIANG',
                stateid: 3,
            },
            {
                id: 22,
                name: 'UPPER SUBANSIRI',
                stateid: 3,
            },
            {
                id: 23,
                name: 'WEST SIANG',
                stateid: 3,
            },
            {
                id: 24,
                name: 'PAPUM PARE',
                stateid: 3,
            },
            {
                id: 25,
                name: 'UPPER SIANG',
                stateid: 3,
            },
            {
                id: 26,
                name: 'KURUNG KUMEY',
                stateid: 3,
            },
            {
                id: 27,
                name: 'CHANGLANG',
                stateid: 3,
            },
            {
                id: 28,
                name: 'TIRAP',
                stateid: 3,
            },
            {
                id: 29,
                name: 'WEST KAMENG',
                stateid: 3,
            },
            {
                id: 30,
                name: 'LOHIT',
                stateid: 3,
            },
            {
                id: 31,
                name: 'TAWANG',
                stateid: 3,
            },
            {
                id: 32,
                name: 'LOWER SUBANSIRI',
                stateid: 3,
            },
            {
                id: 33,
                name: 'KARIMGANJ',
                stateid: 4,
            },
            {
                id: 34,
                name: 'CACHAR',
                stateid: 4,
            },
            {
                id: 35,
                name: 'HAILAKANDI',
                stateid: 4,
            },
            {
                id: 36,
                name: 'NORTH CACHAR HILLS',
                stateid: 4,
            },
            {
                id: 37,
                name: 'SONITPUR',
                stateid: 4,
            },
            {
                id: 38,
                name: 'DARRANG',
                stateid: 4,
            },
            {
                id: 39,
                name: 'DHEMAJI',
                stateid: 4,
            },
            {
                id: 40,
                name: 'LAKHIMPUR',
                stateid: 4,
            },
            {
                id: 41,
                name: 'DIBRUGARH',
                stateid: 4,
            },
            {
                id: 42,
                name: 'KARBI ANGLONG',
                stateid: 4,
            },
            {
                id: 43,
                name: 'MARIGAON',
                stateid: 4,
            },
            {
                id: 44,
                name: 'NAGAON',
                stateid: 4,
            },
            {
                id: 45,
                name: 'GOLAGHAT',
                stateid: 4,
            },
            {
                id: 46,
                name: 'SIBSAGAR',
                stateid: 4,
            },
            {
                id: 47,
                name: 'JORHAT',
                stateid: 4,
            },
            {
                id: 48,
                name: 'TINSUKIA',
                stateid: 4,
            },
            {
                id: 49,
                name: 'BONGAIGAON',
                stateid: 4,
            },
            {
                id: 50,
                name: 'DHUBRI',
                stateid: 4,
            },
            {
                id: 51,
                name: 'GOALPARA',
                stateid: 4,
            },
            {
                id: 52,
                name: 'KOKRAJHAR',
                stateid: 4,
            },
            {
                id: 53,
                name: 'KAMRUP',
                stateid: 4,
            },
            {
                id: 54,
                name: 'BARPETA',
                stateid: 4,
            },
            {
                id: 55,
                name: 'NALBARI',
                stateid: 4,
            },
            {
                id: 56,
                name: 'BEGUSARAI',
                stateid: 5,
            },
            {
                id: 57,
                name: 'KHAGARIA',
                stateid: 5,
            },
            {
                id: 58,
                name: 'DARBHANGA',
                stateid: 5,
            },
            {
                id: 59,
                name: 'MUZAFFARPUR',
                stateid: 5,
            },
            {
                id: 60,
                name: 'SAMASTIPUR',
                stateid: 5,
            },
            {
                id: 61,
                name: 'SITAMARHI',
                stateid: 5,
            },
            {
                id: 62,
                name: 'MADHUBANI',
                stateid: 5,
            },
            {
                id: 63,
                name: 'EAST CHAMPARAN',
                stateid: 5,
            },
            {
                id: 64,
                name: 'SUPAUL',
                stateid: 5,
            },
            {
                id: 65,
                name: 'VAISHALI',
                stateid: 5,
            },
            {
                id: 66,
                name: 'PURNIA',
                stateid: 5,
            },
            {
                id: 67,
                name: 'ARARIA',
                stateid: 5,
            },
            {
                id: 68,
                name: 'KATIHAR',
                stateid: 5,
            },
            {
                id: 69,
                name: 'KISHANGANJ',
                stateid: 5,
            },
            {
                id: 70,
                name: 'SAHARSA',
                stateid: 5,
            },
            {
                id: 71,
                name: 'MADHEPURA',
                stateid: 5,
            },
            {
                id: 72,
                name: 'SARAN',
                stateid: 5,
            },
            {
                id: 73,
                name: 'SIWAN',
                stateid: 5,
            },
            {
                id: 74,
                name: 'BHOJPUR',
                stateid: 5,
            },
            {
                id: 75,
                name: 'SHEOHAR',
                stateid: 5,
            },
            {
                id: 76,
                name: 'GOPALGANJ',
                stateid: 5,
            },
            {
                id: 77,
                name: 'WEST CHAMPARAN',
                stateid: 5,
            },
            {
                id: 78,
                name: 'AURANGABAD(BH)',
                stateid: 5,
            },
            {
                id: 79,
                name: 'GAYA',
                stateid: 5,
            },
            {
                id: 80,
                name: 'ARWAL',
                stateid: 5,
            },
            {
                id: 81,
                name: 'BHAGALPUR',
                stateid: 5,
            },
            {
                id: 82,
                name: 'MUNGER',
                stateid: 5,
            },
            {
                id: 83,
                name: 'BANKA',
                stateid: 5,
            },
            {
                id: 84,
                name: 'BUXAR',
                stateid: 5,
            },
            {
                id: 85,
                name: 'JEHANABAD',
                stateid: 5,
            },
            {
                id: 86,
                name: 'PATNA',
                stateid: 5,
            },
            {
                id: 87,
                name: 'JAMUI',
                stateid: 5,
            },
            {
                id: 88,
                name: 'LAKHISARAI',
                stateid: 5,
            },
            {
                id: 89,
                name: 'SHEIKHPURA',
                stateid: 5,
            },
            {
                id: 90,
                name: 'NALANDA',
                stateid: 5,
            },
            {
                id: 91,
                name: 'NAWADA',
                stateid: 5,
            },
            {
                id: 92,
                name: 'ROHTAS',
                stateid: 5,
            },
            {
                id: 93,
                name: 'KAIMUR (BHABUA)',
                stateid: 5,
            },
            {
                id: 94,
                name: 'CHANDIGARH',
                stateid: 6,
            },
            {
                id: 95,
                name: 'KANKER',
                stateid: 7,
            },
            {
                id: 96,
                name: 'BASTAR',
                stateid: 7,
            },
            {
                id: 97,
                name: 'DANTEWADA',
                stateid: 7,
            },
            {
                id: 98,
                name: 'BIJAPUR(CGH)',
                stateid: 7,
            },
            {
                id: 99,
                name: 'NARAYANPUR',
                stateid: 7,
            },
            {
                id: 100,
                name: 'JANJGIR-CHAMPA',
                stateid: 7,
            },
            {
                id: 101,
                name: 'KORBA',
                stateid: 7,
            },
            {
                id: 102,
                name: 'BILASPUR(CGH)',
                stateid: 7,
            },
            {
                id: 103,
                name: 'DURG',
                stateid: 7,
            },
            {
                id: 104,
                name: 'RAJNANDGAON',
                stateid: 7,
            },
            {
                id: 105,
                name: 'KAWARDHA',
                stateid: 7,
            },
            {
                id: 106,
                name: 'SURGUJA',
                stateid: 7,
            },
            {
                id: 107,
                name: 'RAIGARH',
                stateid: 7,
            },
            {
                id: 108,
                name: 'JASHPUR',
                stateid: 7,
            },
            {
                id: 109,
                name: 'KORIYA',
                stateid: 7,
            },
            {
                id: 110,
                name: 'MAHASAMUND',
                stateid: 7,
            },
            {
                id: 111,
                name: 'DHAMTARI',
                stateid: 7,
            },
            {
                id: 112,
                name: 'RAIPUR',
                stateid: 7,
            },
            {
                id: 113,
                name: 'GARIABAND',
                stateid: 7,
            },
            {
                id: 114,
                name: 'DIU',
                stateid: 8,
            },
            {
                id: 115,
                name: 'DADRA & NAGAR HAVELI',
                stateid: 8,
            },
            {
                id: 116,
                name: 'DAMAN',
                stateid: 8,
            },
            {
                id: 117,
                name: 'EAST DELHI',
                stateid: 9,
            },
            {
                id: 118,
                name: 'NORTH EAST DELHI',
                stateid: 9,
            },
            {
                id: 119,
                name: 'NORTH WEST DELHI',
                stateid: 9,
            },
            {
                id: 120,
                name: 'NORTH DELHI',
                stateid: 9,
            },
            {
                id: 121,
                name: 'CENTRAL DELHI',
                stateid: 9,
            },
            {
                id: 122,
                name: 'NEW DELHI',
                stateid: 9,
            },
            {
                id: 123,
                name: 'SOUTH DELHI',
                stateid: 9,
            },
            {
                id: 124,
                name: 'SOUTH WEST DELHI',
                stateid: 9,
            },
            {
                id: 125,
                name: 'WEST DELHI',
                stateid: 9,
            },
            {
                id: 126,
                name: 'SOUTH GOA',
                stateid: 10,
            },
            {
                id: 127,
                name: 'NORTH GOA',
                stateid: 10,
            },
            {
                id: 128,
                name: 'GANDHI NAGAR',
                stateid: 11,
            },
            {
                id: 129,
                name: 'AHMEDABAD',
                stateid: 11,
            },
            {
                id: 130,
                name: 'BANASKANTHA',
                stateid: 11,
            },
            {
                id: 131,
                name: 'MAHESANA',
                stateid: 11,
            },
            {
                id: 132,
                name: 'SURENDRA NAGAR',
                stateid: 11,
            },
            {
                id: 133,
                name: 'PATAN',
                stateid: 11,
            },
            {
                id: 134,
                name: 'SABARKANTHA',
                stateid: 11,
            },
            {
                id: 135,
                name: 'AMRELI',
                stateid: 11,
            },
            {
                id: 136,
                name: 'JUNAGADH',
                stateid: 11,
            },
            {
                id: 137,
                name: 'BHAVNAGAR',
                stateid: 11,
            },
            {
                id: 138,
                name: 'RAJKOT',
                stateid: 11,
            },
            {
                id: 139,
                name: 'PORBANDAR',
                stateid: 11,
            },
            {
                id: 140,
                name: 'JAMNAGAR',
                stateid: 11,
            },
            {
                id: 141,
                name: 'KACHCHH',
                stateid: 11,
            },
            {
                id: 142,
                name: 'ANAND',
                stateid: 11,
            },
            {
                id: 143,
                name: 'KHEDA',
                stateid: 11,
            },
            {
                id: 144,
                name: 'SURAT',
                stateid: 11,
            },
            {
                id: 145,
                name: 'THE DANGS',
                stateid: 11,
            },
            {
                id: 146,
                name: 'TAPI',
                stateid: 11,
            },
            {
                id: 147,
                name: 'NAVSARI',
                stateid: 11,
            },
            {
                id: 148,
                name: 'BHARUCH',
                stateid: 11,
            },
            {
                id: 149,
                name: 'NARMADA',
                stateid: 11,
            },
            {
                id: 150,
                name: 'VADODARA',
                stateid: 11,
            },
            {
                id: 151,
                name: 'DAHOD',
                stateid: 11,
            },
            {
                id: 152,
                name: 'PANCH MAHALS',
                stateid: 11,
            },
            {
                id: 153,
                name: 'VALSAD',
                stateid: 11,
            },
            {
                id: 154,
                name: 'MORBI',
                stateid: 11,
            },
            {
                id: 155,
                name: 'YAMUNA NAGAR',
                stateid: 12,
            },
            {
                id: 156,
                name: 'AMBALA',
                stateid: 12,
            },
            {
                id: 157,
                name: 'PANCHKULA',
                stateid: 12,
            },
            {
                id: 158,
                name: 'BHIWANI',
                stateid: 12,
            },
            {
                id: 159,
                name: 'FARIDABAD',
                stateid: 12,
            },
            {
                id: 160,
                name: 'MAHENDRAGARH',
                stateid: 12,
            },
            {
                id: 161,
                name: 'GURGAON',
                stateid: 12,
            },
            {
                id: 162,
                name: 'REWARI',
                stateid: 12,
            },
            {
                id: 163,
                name: 'FATEHABAD',
                stateid: 12,
            },
            {
                id: 164,
                name: 'SIRSA',
                stateid: 12,
            },
            {
                id: 165,
                name: 'HISAR',
                stateid: 12,
            },
            {
                id: 166,
                name: 'KARNAL',
                stateid: 12,
            },
            {
                id: 167,
                name: 'PANIPAT',
                stateid: 12,
            },
            {
                id: 168,
                name: 'JIND',
                stateid: 12,
            },
            {
                id: 169,
                name: 'KAITHAL',
                stateid: 12,
            },
            {
                id: 170,
                name: 'KURUKSHETRA',
                stateid: 12,
            },
            {
                id: 171,
                name: 'JHAJJAR',
                stateid: 12,
            },
            {
                id: 172,
                name: 'ROHTAK',
                stateid: 12,
            },
            {
                id: 173,
                name: 'SONIPAT',
                stateid: 12,
            },
            {
                id: 174,
                name: 'CHARKHI DADRI',
                stateid: 12,
            },
            {
                id: 175,
                name: 'CHAMBA',
                stateid: 13,
            },
            {
                id: 176,
                name: 'KANGRA',
                stateid: 13,
            },
            {
                id: 177,
                name: 'HAMIRPUR(HP)',
                stateid: 13,
            },
            {
                id: 178,
                name: 'BILASPUR (HP)',
                stateid: 13,
            },
            {
                id: 179,
                name: 'UNA',
                stateid: 13,
            },
            {
                id: 180,
                name: 'KULLU',
                stateid: 13,
            },
            {
                id: 181,
                name: 'MANDI',
                stateid: 13,
            },
            {
                id: 182,
                name: 'LAHUL & SPITI',
                stateid: 13,
            },
            {
                id: 183,
                name: 'SHIMLA',
                stateid: 13,
            },
            {
                id: 184,
                name: 'KINNAUR',
                stateid: 13,
            },
            {
                id: 185,
                name: 'SIRMAUR',
                stateid: 13,
            },
            {
                id: 186,
                name: 'SOLAN',
                stateid: 13,
            },
            {
                id: 187,
                name: 'BARAMULLA',
                stateid: 14,
            },
            {
                id: 188,
                name: 'KUPWARA',
                stateid: 14,
            },
            {
                id: 189,
                name: 'BANDIPUR',
                stateid: 14,
            },
            {
                id: 190,
                name: 'JAMMU',
                stateid: 14,
            },
            {
                id: 191,
                name: 'KATHUA',
                stateid: 14,
            },
            {
                id: 192,
                name: 'UDHAMPUR',
                stateid: 14,
            },
            {
                id: 193,
                name: 'POONCH',
                stateid: 14,
            },
            {
                id: 194,
                name: 'KARGIL',
                stateid: 14,
            },
            {
                id: 195,
                name: 'LEH',
                stateid: 14,
            },
            {
                id: 196,
                name: 'RAJAURI',
                stateid: 14,
            },
            {
                id: 197,
                name: 'REASI',
                stateid: 14,
            },
            {
                id: 198,
                name: 'SRINAGAR',
                stateid: 14,
            },
            {
                id: 199,
                name: 'ANANTHNAG',
                stateid: 14,
            },
            {
                id: 200,
                name: 'KULGAM',
                stateid: 14,
            },
            {
                id: 201,
                name: 'BUDGAM',
                stateid: 14,
            },
            {
                id: 202,
                name: 'PULWAMA',
                stateid: 14,
            },
            {
                id: 203,
                name: 'SHOPIAN',
                stateid: 14,
            },
            {
                id: 204,
                name: 'DODA',
                stateid: 14,
            },
            {
                id: 205,
                name: 'BOKARO',
                stateid: 15,
            },
            {
                id: 206,
                name: 'DHANBAD',
                stateid: 15,
            },
            {
                id: 207,
                name: 'GIRIDH',
                stateid: 15,
            },
            {
                id: 208,
                name: 'CHATRA',
                stateid: 15,
            },
            {
                id: 209,
                name: 'KODERMA',
                stateid: 15,
            },
            {
                id: 210,
                name: 'HAZARIBAG',
                stateid: 15,
            },
            {
                id: 211,
                name: 'RAMGARH',
                stateid: 15,
            },
            {
                id: 212,
                name: 'PALAMAU',
                stateid: 15,
            },
            {
                id: 213,
                name: 'LATEHAR',
                stateid: 15,
            },
            {
                id: 214,
                name: 'GARHWA',
                stateid: 15,
            },
            {
                id: 215,
                name: 'RANCHI',
                stateid: 15,
            },
            {
                id: 216,
                name: 'SIMDEGA',
                stateid: 15,
            },
            {
                id: 217,
                name: 'GUMLA',
                stateid: 15,
            },
            {
                id: 218,
                name: 'LOHARDAGA',
                stateid: 15,
            },
            {
                id: 219,
                name: 'WEST SINGHBHUM',
                stateid: 15,
            },
            {
                id: 220,
                name: 'KHUNTI',
                stateid: 15,
            },
            {
                id: 221,
                name: 'GODDA',
                stateid: 15,
            },
            {
                id: 222,
                name: 'JAMTARA',
                stateid: 15,
            },
            {
                id: 223,
                name: 'DUMKA',
                stateid: 15,
            },
            {
                id: 224,
                name: 'DEOGHAR',
                stateid: 15,
            },
            {
                id: 225,
                name: 'SAHIBGANJ',
                stateid: 15,
            },
            {
                id: 226,
                name: 'PAKUR',
                stateid: 15,
            },
            {
                id: 227,
                name: 'SERAIKELA-KHARSAWAN',
                stateid: 15,
            },
            {
                id: 228,
                name: 'EAST SINGHBHUM',
                stateid: 15,
            },
            {
                id: 229,
                name: 'JAMSHEDPUR',
                stateid: 15,
            },
            {
                id: 230,
                name: 'TATANAGAR',
                stateid: 15,
            },
            {
                id: 231,
                name: 'BANGALORE',
                stateid: 16,
            },
            {
                id: 232,
                name: 'BANGALORE RURAL',
                stateid: 16,
            },
            {
                id: 233,
                name: 'RAMANAGAR',
                stateid: 16,
            },
            {
                id: 234,
                name: 'BAGALKOT',
                stateid: 16,
            },
            {
                id: 235,
                name: 'BIJAPUR(KAR)',
                stateid: 16,
            },
            {
                id: 236,
                name: 'BELGAUM',
                stateid: 16,
            },
            {
                id: 237,
                name: 'DAVANGERE',
                stateid: 16,
            },
            {
                id: 238,
                name: 'BELLARY',
                stateid: 16,
            },
            {
                id: 239,
                name: 'BIDAR',
                stateid: 16,
            },
            {
                id: 240,
                name: 'DHARWAD',
                stateid: 16,
            },
            {
                id: 241,
                name: 'GADAG',
                stateid: 16,
            },
            {
                id: 242,
                name: 'KOPPAL',
                stateid: 16,
            },
            {
                id: 243,
                name: 'GULBARGA',
                stateid: 16,
            },
            {
                id: 244,
                name: 'YADGIR',
                stateid: 16,
            },
            {
                id: 245,
                name: 'HAVERI',
                stateid: 16,
            },
            {
                id: 246,
                name: 'UTTARA KANNADA',
                stateid: 16,
            },
            {
                id: 247,
                name: 'RAICHUR',
                stateid: 16,
            },
            {
                id: 248,
                name: 'CHICKMAGALUR',
                stateid: 16,
            },
            {
                id: 249,
                name: 'CHITRADURGA',
                stateid: 16,
            },
            {
                id: 250,
                name: 'HASSAN',
                stateid: 16,
            },
            {
                id: 251,
                name: 'KODAGU',
                stateid: 16,
            },
            {
                id: 252,
                name: 'KOLAR',
                stateid: 16,
            },
            {
                id: 253,
                name: 'CHIKKABALLAPUR',
                stateid: 16,
            },
            {
                id: 254,
                name: 'MANDYA',
                stateid: 16,
            },
            {
                id: 255,
                name: 'DAKSHINA KANNADA MANGALORE',
                stateid: 16,
            },
            {
                id: 256,
                name: 'UDUPI',
                stateid: 16,
            },
            {
                id: 257,
                name: 'MYSORE',
                stateid: 16,
            },
            {
                id: 258,
                name: 'CHAMRAJNAGAR',
                stateid: 16,
            },
            {
                id: 259,
                name: 'SHIMOGA',
                stateid: 16,
            },
            {
                id: 260,
                name: 'TUMKUR',
                stateid: 16,
            },
            {
                id: 261,
                name: 'KOZHIKODE',
                stateid: 17,
            },
            {
                id: 262,
                name: 'WAYANAD',
                stateid: 17,
            },
            {
                id: 263,
                name: 'MALAPPURAM',
                stateid: 17,
            },
            {
                id: 264,
                name: 'KANNUR',
                stateid: 17,
            },
            {
                id: 265,
                name: 'KASARGOD',
                stateid: 17,
            },
            {
                id: 266,
                name: 'PALAKKAD',
                stateid: 17,
            },
            {
                id: 267,
                name: 'ALAPPUZHA',
                stateid: 17,
            },
            {
                id: 268,
                name: 'ERNAKULAM',
                stateid: 17,
            },
            {
                id: 269,
                name: 'KOTTAYAM',
                stateid: 17,
            },
            {
                id: 270,
                name: 'IDUKKI',
                stateid: 17,
            },
            {
                id: 271,
                name: 'PATHANAMTHITTA',
                stateid: 17,
            },
            {
                id: 272,
                name: 'THRISSUR',
                stateid: 17,
            },
            {
                id: 273,
                name: 'KOLLAM',
                stateid: 17,
            },
            {
                id: 274,
                name: 'THIRUVANANTHAPURAM',
                stateid: 17,
            },
            {
                id: 275,
                name: 'KOTTARAKKARA',
                stateid: 17,
            },
            {
                id: 276,
                name: 'LAKSHADWEEP',
                stateid: 19,
            },
            {
                id: 277,
                name: 'SEONI',
                stateid: 20,
            },
            {
                id: 278,
                name: 'BALAGHAT',
                stateid: 20,
            },
            {
                id: 279,
                name: 'DINDORI',
                stateid: 20,
            },
            {
                id: 280,
                name: 'MANDLA',
                stateid: 20,
            },
            {
                id: 281,
                name: 'BHOPAL',
                stateid: 20,
            },
            {
                id: 282,
                name: 'RAISEN',
                stateid: 20,
            },
            {
                id: 283,
                name: 'CHHATARPUR',
                stateid: 20,
            },
            {
                id: 284,
                name: 'PANNA',
                stateid: 20,
            },
            {
                id: 285,
                name: 'TIKAMGARH',
                stateid: 20,
            },
            {
                id: 286,
                name: 'CHHINDWARA',
                stateid: 20,
            },
            {
                id: 287,
                name: 'BETUL',
                stateid: 20,
            },
            {
                id: 288,
                name: 'HOSHANGABAD',
                stateid: 20,
            },
            {
                id: 289,
                name: 'NARSINGHPUR',
                stateid: 20,
            },
            {
                id: 290,
                name: 'HARDA',
                stateid: 20,
            },
            {
                id: 291,
                name: 'SATNA',
                stateid: 20,
            },
            {
                id: 292,
                name: 'REWA',
                stateid: 20,
            },
            {
                id: 293,
                name: 'DAMOH',
                stateid: 20,
            },
            {
                id: 294,
                name: 'SAGAR',
                stateid: 20,
            },
            {
                id: 295,
                name: 'SHAHDOL',
                stateid: 20,
            },
            {
                id: 296,
                name: 'SIDHI',
                stateid: 20,
            },
            {
                id: 297,
                name: 'ANUPPUR',
                stateid: 20,
            },
            {
                id: 298,
                name: 'UMARIA',
                stateid: 20,
            },
            {
                id: 299,
                name: 'SINGRAULI',
                stateid: 20,
            },
            {
                id: 300,
                name: 'VIDISHA',
                stateid: 20,
            },
            {
                id: 301,
                name: 'ASHOK NAGAR',
                stateid: 20,
            },
            {
                id: 302,
                name: 'GUNA',
                stateid: 20,
            },
            {
                id: 303,
                name: 'SHIVPURI',
                stateid: 20,
            },
            {
                id: 304,
                name: 'GWALIOR',
                stateid: 20,
            },
            {
                id: 305,
                name: 'DATIA',
                stateid: 20,
            },
            {
                id: 306,
                name: 'BHIND',
                stateid: 20,
            },
            {
                id: 307,
                name: 'SHEOPUR',
                stateid: 20,
            },
            {
                id: 308,
                name: 'MORENA',
                stateid: 20,
            },
            {
                id: 309,
                name: 'INDORE',
                stateid: 20,
            },
            {
                id: 310,
                name: 'DEWAS',
                stateid: 20,
            },
            {
                id: 311,
                name: 'DHAR',
                stateid: 20,
            },
            {
                id: 312,
                name: 'JABALPUR',
                stateid: 20,
            },
            {
                id: 313,
                name: 'KATNI',
                stateid: 20,
            },
            {
                id: 314,
                name: 'WEST NIMAR',
                stateid: 20,
            },
            {
                id: 315,
                name: 'BARWANI',
                stateid: 20,
            },
            {
                id: 316,
                name: 'EAST NIMAR',
                stateid: 20,
            },
            {
                id: 317,
                name: 'KHARGONE',
                stateid: 20,
            },
            {
                id: 318,
                name: 'BURHANPUR',
                stateid: 20,
            },
            {
                id: 319,
                name: 'KHANDWA',
                stateid: 20,
            },
            {
                id: 320,
                name: 'MANDSAUR',
                stateid: 20,
            },
            {
                id: 321,
                name: 'NEEMUCH',
                stateid: 20,
            },
            {
                id: 322,
                name: 'RATLAM',
                stateid: 20,
            },
            {
                id: 323,
                name: 'JHABUA',
                stateid: 20,
            },
            {
                id: 324,
                name: 'ALIRAJPUR',
                stateid: 20,
            },
            {
                id: 325,
                name: 'SEHORE',
                stateid: 20,
            },
            {
                id: 326,
                name: 'RAJGARH',
                stateid: 20,
            },
            {
                id: 327,
                name: 'SHAJAPUR',
                stateid: 20,
            },
            {
                id: 328,
                name: 'UJJAIN',
                stateid: 20,
            },
            {
                id: 329,
                name: 'AURANGABAD',
                stateid: 21,
            },
            {
                id: 330,
                name: 'JALNA',
                stateid: 21,
            },
            {
                id: 331,
                name: 'BEED',
                stateid: 21,
            },
            {
                id: 332,
                name: 'JALGAON',
                stateid: 21,
            },
            {
                id: 333,
                name: 'DHULE',
                stateid: 21,
            },
            {
                id: 334,
                name: 'NANDURBAR',
                stateid: 21,
            },
            {
                id: 335,
                name: 'NASHIK',
                stateid: 21,
            },
            {
                id: 336,
                name: 'NANDED',
                stateid: 21,
            },
            {
                id: 337,
                name: 'LATUR',
                stateid: 21,
            },
            {
                id: 338,
                name: 'OSMANABAD',
                stateid: 21,
            },
            {
                id: 339,
                name: 'HINGOLI',
                stateid: 21,
            },
            {
                id: 340,
                name: 'PARBHANI',
                stateid: 21,
            },
            {
                id: 341,
                name: 'KOLHAPUR',
                stateid: 21,
            },
            {
                id: 342,
                name: 'RATNAGIRI',
                stateid: 21,
            },
            {
                id: 343,
                name: 'SINDHUDURG',
                stateid: 21,
            },
            {
                id: 344,
                name: 'SATARA',
                stateid: 21,
            },
            {
                id: 345,
                name: 'SANGLI',
                stateid: 21,
            },
            {
                id: 346,
                name: 'MUMBAI',
                stateid: 21,
            },
            {
                id: 347,
                name: 'RAIGARH(MH)',
                stateid: 21,
            },
            {
                id: 348,
                name: 'THANE',
                stateid: 21,
            },
            {
                id: 349,
                name: 'AKOLA',
                stateid: 21,
            },
            {
                id: 350,
                name: 'WASHIM',
                stateid: 21,
            },
            {
                id: 351,
                name: 'AMRAVATI',
                stateid: 21,
            },
            {
                id: 352,
                name: 'BULDHANA',
                stateid: 21,
            },
            {
                id: 353,
                name: 'CHANDRAPUR',
                stateid: 21,
            },
            {
                id: 354,
                name: 'GADCHIROLI',
                stateid: 21,
            },
            {
                id: 355,
                name: 'NAGPUR',
                stateid: 21,
            },
            {
                id: 356,
                name: 'GONDIA',
                stateid: 21,
            },
            {
                id: 357,
                name: 'BHANDARA',
                stateid: 21,
            },
            {
                id: 358,
                name: 'WARDHA',
                stateid: 21,
            },
            {
                id: 359,
                name: 'YAVATMAL',
                stateid: 21,
            },
            {
                id: 360,
                name: 'AHMED NAGAR',
                stateid: 21,
            },
            {
                id: 361,
                name: 'SOLAPUR',
                stateid: 21,
            },
            {
                id: 362,
                name: 'PUNE',
                stateid: 21,
            },
            {
                id: 363,
                name: 'NAVI MUMBAI',
                stateid: 21,
            },
            {
                id: 364,
                name: 'THOUBAL',
                stateid: 22,
            },
            {
                id: 365,
                name: 'TAMENGLONG',
                stateid: 22,
            },
            {
                id: 366,
                name: 'IMPHAL EAST',
                stateid: 22,
            },
            {
                id: 367,
                name: 'BISHNUPUR',
                stateid: 22,
            },
            {
                id: 368,
                name: 'IMPHAL WEST',
                stateid: 22,
            },
            {
                id: 369,
                name: 'CHURACHANDPUR',
                stateid: 22,
            },
            {
                id: 370,
                name: 'CHANDEL',
                stateid: 22,
            },
            {
                id: 371,
                name: 'UKHRUL',
                stateid: 22,
            },
            {
                id: 372,
                name: 'SENAPATI',
                stateid: 22,
            },
            {
                id: 373,
                name: 'EAST KHASI HILLS',
                stateid: 23,
            },
            {
                id: 374,
                name: 'SOUTH GARO HILLS',
                stateid: 23,
            },
            {
                id: 375,
                name: 'JAINTIA HILLS',
                stateid: 23,
            },
            {
                id: 376,
                name: 'WEST GARO HILLS',
                stateid: 23,
            },
            {
                id: 377,
                name: 'EAST GARO HILLS',
                stateid: 23,
            },
            {
                id: 378,
                name: 'RI BHOI',
                stateid: 23,
            },
            {
                id: 379,
                name: 'WEST KHASI HILLS',
                stateid: 23,
            },
            {
                id: 380,
                name: 'MAMMIT',
                stateid: 24,
            },
            {
                id: 381,
                name: 'AIZAWL',
                stateid: 24,
            },
            {
                id: 382,
                name: 'KOLASIB',
                stateid: 24,
            },
            {
                id: 383,
                name: 'SAIHA',
                stateid: 24,
            },
            {
                id: 384,
                name: 'LUNGLEI',
                stateid: 24,
            },
            {
                id: 385,
                name: 'CHAMPHAI',
                stateid: 24,
            },
            {
                id: 386,
                name: 'LAWNGTLAI',
                stateid: 24,
            },
            {
                id: 387,
                name: 'SERCHHIP',
                stateid: 24,
            },
            {
                id: 388,
                name: 'ZUNHEBOTTO',
                stateid: 25,
            },
            {
                id: 389,
                name: 'KIPHIRE',
                stateid: 25,
            },
            {
                id: 390,
                name: 'KOHIMA',
                stateid: 25,
            },
            {
                id: 391,
                name: 'MOKOKCHUNG',
                stateid: 25,
            },
            {
                id: 392,
                name: 'TUENSANG',
                stateid: 25,
            },
            {
                id: 393,
                name: 'PHEK',
                stateid: 25,
            },
            {
                id: 394,
                name: 'WOKHA',
                stateid: 25,
            },
            {
                id: 395,
                name: 'LONGLENG',
                stateid: 25,
            },
            {
                id: 396,
                name: 'DIMAPUR',
                stateid: 25,
            },
            {
                id: 397,
                name: 'MON',
                stateid: 25,
            },
            {
                id: 398,
                name: 'PEREN',
                stateid: 25,
            },
            {
                id: 399,
                name: 'GANJAM',
                stateid: 26,
            },
            {
                id: 400,
                name: 'GAJAPATI',
                stateid: 26,
            },
            {
                id: 401,
                name: 'NUAPADA',
                stateid: 26,
            },
            {
                id: 402,
                name: 'KALAHANDI',
                stateid: 26,
            },
            {
                id: 403,
                name: 'NABARANGAPUR',
                stateid: 26,
            },
            {
                id: 404,
                name: 'RAYAGADA',
                stateid: 26,
            },
            {
                id: 405,
                name: 'KORAPUT',
                stateid: 26,
            },
            {
                id: 406,
                name: 'MALKANGIRI',
                stateid: 26,
            },
            {
                id: 407,
                name: 'KANDHAMAL',
                stateid: 26,
            },
            {
                id: 408,
                name: 'BOUDH',
                stateid: 26,
            },
            {
                id: 409,
                name: 'BALESWAR',
                stateid: 26,
            },
            {
                id: 410,
                name: 'BHADRAK',
                stateid: 26,
            },
            {
                id: 411,
                name: 'KENDUJHAR',
                stateid: 26,
            },
            {
                id: 412,
                name: 'KHORDA',
                stateid: 26,
            },
            {
                id: 413,
                name: 'PURI',
                stateid: 26,
            },
            {
                id: 414,
                name: 'CUTTACK',
                stateid: 26,
            },
            {
                id: 415,
                name: 'JAJAPUR',
                stateid: 26,
            },
            {
                id: 416,
                name: 'KENDRAPARA',
                stateid: 26,
            },
            {
                id: 417,
                name: 'JAGATSINGHAPUR',
                stateid: 26,
            },
            {
                id: 418,
                name: 'MAYURBHANJ',
                stateid: 26,
            },
            {
                id: 419,
                name: 'NAYAGARH',
                stateid: 26,
            },
            {
                id: 420,
                name: 'SONAPUR',
                stateid: 26,
            },
            {
                id: 421,
                name: 'BALANGIR',
                stateid: 26,
            },
            {
                id: 422,
                name: 'ANGUL',
                stateid: 26,
            },
            {
                id: 423,
                name: 'DHENKANAL',
                stateid: 26,
            },
            {
                id: 424,
                name: 'SAMBALPUR',
                stateid: 26,
            },
            {
                id: 425,
                name: 'DEBAGARH',
                stateid: 26,
            },
            {
                id: 426,
                name: 'BARGARH',
                stateid: 26,
            },
            {
                id: 427,
                name: 'JHARSUGUDA',
                stateid: 26,
            },
            {
                id: 428,
                name: 'SUNDERGARH',
                stateid: 26,
            },
            {
                id: 429,
                name: 'PONDICHERRY',
                stateid: 27,
            },
            {
                id: 430,
                name: 'MAHE',
                stateid: 27,
            },
            {
                id: 431,
                name: 'KARAIKAL',
                stateid: 27,
            },
            {
                id: 432,
                name: 'RUPNAGAR',
                stateid: 28,
            },
            {
                id: 433,
                name: 'PATIALA',
                stateid: 28,
            },
            {
                id: 434,
                name: 'MOHALI',
                stateid: 28,
            },
            {
                id: 435,
                name: 'ROPAR',
                stateid: 28,
            },
            {
                id: 436,
                name: 'LUDHIANA',
                stateid: 28,
            },
            {
                id: 437,
                name: 'FATEHGARH SAHIB',
                stateid: 28,
            },
            {
                id: 438,
                name: 'SANGRUR',
                stateid: 28,
            },
            {
                id: 439,
                name: 'BARNALA',
                stateid: 28,
            },
            {
                id: 440,
                name: 'AMRITSAR',
                stateid: 28,
            },
            {
                id: 441,
                name: 'TARN TARAN',
                stateid: 28,
            },
            {
                id: 442,
                name: 'MANSA',
                stateid: 28,
            },
            {
                id: 443,
                name: 'BATHINDA',
                stateid: 28,
            },
            {
                id: 444,
                name: 'MOGA',
                stateid: 28,
            },
            {
                id: 445,
                name: 'MUKTSAR',
                stateid: 28,
            },
            {
                id: 446,
                name: 'FARIDKOT',
                stateid: 28,
            },
            {
                id: 447,
                name: 'FIROZPUR',
                stateid: 28,
            },
            {
                id: 448,
                name: 'FAZILKA',
                stateid: 28,
            },
            {
                id: 449,
                name: 'GURDASPUR',
                stateid: 28,
            },
            {
                id: 450,
                name: 'PATHANKOT',
                stateid: 28,
            },
            {
                id: 451,
                name: 'HOSHIARPUR',
                stateid: 28,
            },
            {
                id: 452,
                name: 'NAWANSHAHR',
                stateid: 28,
            },
            {
                id: 453,
                name: 'JALANDHAR',
                stateid: 28,
            },
            {
                id: 454,
                name: 'KAPURTHALA',
                stateid: 28,
            },
            {
                id: 455,
                name: 'ABOHAR',
                stateid: 28,
            },
            {
                id: 456,
                name: 'AJMER',
                stateid: 29,
            },
            {
                id: 457,
                name: 'RAJSAMAND',
                stateid: 29,
            },
            {
                id: 458,
                name: 'BHILWARA',
                stateid: 29,
            },
            {
                id: 459,
                name: 'CHITTORGARH',
                stateid: 29,
            },
            {
                id: 460,
                name: 'DUNGARPUR',
                stateid: 29,
            },
            {
                id: 461,
                name: 'BANSWARA',
                stateid: 29,
            },
            {
                id: 462,
                name: 'JHALAWAR',
                stateid: 29,
            },
            {
                id: 463,
                name: 'BARAN',
                stateid: 29,
            },
            {
                id: 464,
                name: 'KOTA',
                stateid: 29,
            },
            {
                id: 465,
                name: 'TONK',
                stateid: 29,
            },
            {
                id: 466,
                name: 'BUNDI',
                stateid: 29,
            },
            {
                id: 467,
                name: 'UDAIPUR',
                stateid: 29,
            },
            {
                id: 468,
                name: 'ALWAR',
                stateid: 29,
            },
            {
                id: 469,
                name: 'BHARATPUR',
                stateid: 29,
            },
            {
                id: 470,
                name: 'DHOLPUR',
                stateid: 29,
            },
            {
                id: 471,
                name: 'JAIPUR',
                stateid: 29,
            },
            {
                id: 472,
                name: 'DAUSA',
                stateid: 29,
            },
            {
                id: 473,
                name: 'SAWAI MADHOPUR',
                stateid: 29,
            },
            {
                id: 474,
                name: 'KARAULI',
                stateid: 29,
            },
            {
                id: 475,
                name: 'BARMER',
                stateid: 29,
            },
            {
                id: 476,
                name: 'BIKANER',
                stateid: 29,
            },
            {
                id: 477,
                name: 'CHURU',
                stateid: 29,
            },
            {
                id: 478,
                name: 'JHUJHUNU',
                stateid: 29,
            },
            {
                id: 479,
                name: 'JAISALMER',
                stateid: 29,
            },
            {
                id: 480,
                name: 'JODHPUR',
                stateid: 29,
            },
            {
                id: 481,
                name: 'NAGAUR',
                stateid: 29,
            },
            {
                id: 482,
                name: 'PALI',
                stateid: 29,
            },
            {
                id: 483,
                name: 'SIKAR',
                stateid: 29,
            },
            {
                id: 484,
                name: 'SIROHI',
                stateid: 29,
            },
            {
                id: 485,
                name: 'JALOR',
                stateid: 29,
            },
            {
                id: 486,
                name: 'GANGANAGAR',
                stateid: 29,
            },
            {
                id: 487,
                name: 'HANUMANGARH',
                stateid: 29,
            },
            {
                id: 488,
                name: 'SHAHJAHANPUR',
                stateid: 29,
            },
            {
                id: 489,
                name: 'ABU ROAD',
                stateid: 29,
            },
            {
                id: 490,
                name: 'NORTH SIKKIM',
                stateid: 30,
            },
            {
                id: 491,
                name: 'EAST SIKKIM',
                stateid: 30,
            },
            {
                id: 492,
                name: 'WEST SIKKIM',
                stateid: 30,
            },
            {
                id: 493,
                name: 'SOUTH SIKKIM',
                stateid: 30,
            },
            {
                id: 494,
                name: 'CHENNAI',
                stateid: 31,
            },
            {
                id: 495,
                name: 'VELLORE',
                stateid: 31,
            },
            {
                id: 496,
                name: 'TIRUVANNAMALAI',
                stateid: 31,
            },
            {
                id: 497,
                name: 'KANCHIPURAM',
                stateid: 31,
            },
            {
                id: 498,
                name: 'TIRUVALLUR',
                stateid: 31,
            },
            {
                id: 499,
                name: 'VILLUPURAM',
                stateid: 31,
            },
            {
                id: 500,
                name: 'CUDDALORE',
                stateid: 31,
            },
            {
                id: 501,
                name: 'COIMBATORE',
                stateid: 31,
            },
            {
                id: 502,
                name: 'DHARMAPURI',
                stateid: 31,
            },
            {
                id: 503,
                name: 'SALEM',
                stateid: 31,
            },
            {
                id: 504,
                name: 'ERODE',
                stateid: 31,
            },
            {
                id: 505,
                name: 'NAMAKKAL',
                stateid: 31,
            },
            {
                id: 506,
                name: 'KARUR',
                stateid: 31,
            },
            {
                id: 507,
                name: 'KRISHNAGIRI',
                stateid: 31,
            },
            {
                id: 508,
                name: 'NILGIRIS',
                stateid: 31,
            },
            {
                id: 509,
                name: 'DINDIGUL',
                stateid: 31,
            },
            {
                id: 510,
                name: 'KANYAKUMARI',
                stateid: 31,
            },
            {
                id: 511,
                name: 'SIVAGANGA',
                stateid: 31,
            },
            {
                id: 512,
                name: 'RAMANATHAPURAM',
                stateid: 31,
            },
            {
                id: 513,
                name: 'TUTICORIN',
                stateid: 31,
            },
            {
                id: 514,
                name: 'TIRUNELVELI',
                stateid: 31,
            },
            {
                id: 515,
                name: 'MADURAI',
                stateid: 31,
            },
            {
                id: 516,
                name: 'THENI',
                stateid: 31,
            },
            {
                id: 517,
                name: 'VIRUDHUNAGAR',
                stateid: 31,
            },
            {
                id: 518,
                name: 'ARIYALUR',
                stateid: 31,
            },
            {
                id: 519,
                name: 'TIRUCHIRAPPALLI',
                stateid: 31,
            },
            {
                id: 520,
                name: 'PUDUKKOTTAI',
                stateid: 31,
            },
            {
                id: 521,
                name: 'THANJAVUR',
                stateid: 31,
            },
            {
                id: 522,
                name: 'NAGAPATTINAM',
                stateid: 31,
            },
            {
                id: 523,
                name: 'TIRUVARUR',
                stateid: 31,
            },
            {
                id: 524,
                name: 'PERAMBALUR',
                stateid: 31,
            },
            {
                id: 525,
                name: 'HOSUR',
                stateid: 31,
            },
            {
                id: 526,
                name: 'ADILABAD',
                stateid: 32,
            },
            {
                id: 527,
                name: 'WARANGAL',
                stateid: 32,
            },
            {
                id: 528,
                name: 'KARIM NAGAR',
                stateid: 32,
            },
            {
                id: 529,
                name: 'K.V.RANGAREDDY',
                stateid: 32,
            },
            {
                id: 530,
                name: 'MEDAK',
                stateid: 32,
            },
            {
                id: 531,
                name: 'NALGONDA',
                stateid: 32,
            },
            {
                id: 532,
                name: 'NIZAMABAD',
                stateid: 32,
            },
            {
                id: 533,
                name: 'HYDERABAD',
                stateid: 32,
            },
            {
                id: 534,
                name: 'KHAMMAM',
                stateid: 32,
            },
            {
                id: 535,
                name: 'ACHAMPET',
                stateid: 32,
            },
            {
                id: 536,
                name: 'WEST TRIPURA',
                stateid: 33,
            },
            {
                id: 537,
                name: 'SOUTH TRIPURA',
                stateid: 33,
            },
            {
                id: 538,
                name: 'NORTH TRIPURA',
                stateid: 33,
            },
            {
                id: 539,
                name: 'DHALAI',
                stateid: 33,
            },
            {
                id: 540,
                name: 'AGRA',
                stateid: 34,
            },
            {
                id: 541,
                name: 'ALIGARH',
                stateid: 34,
            },
            {
                id: 542,
                name: 'HATHRAS',
                stateid: 34,
            },
            {
                id: 543,
                name: 'BULANDSHAHR',
                stateid: 34,
            },
            {
                id: 544,
                name: 'GAUTAM BUDDHA NAGAR',
                stateid: 34,
            },
            {
                id: 545,
                name: 'ETAH',
                stateid: 34,
            },
            {
                id: 546,
                name: 'FIROZABAD',
                stateid: 34,
            },
            {
                id: 547,
                name: 'AURAIYA',
                stateid: 34,
            },
            {
                id: 548,
                name: 'ETAWAH',
                stateid: 34,
            },
            {
                id: 549,
                name: 'JALAUN',
                stateid: 34,
            },
            {
                id: 550,
                name: 'JHANSI',
                stateid: 34,
            },
            {
                id: 551,
                name: 'LALITPUR',
                stateid: 34,
            },
            {
                id: 552,
                name: 'MAINPURI',
                stateid: 34,
            },
            {
                id: 553,
                name: 'MATHURA',
                stateid: 34,
            },
            {
                id: 554,
                name: 'AZAMGARH',
                stateid: 34,
            },
            {
                id: 555,
                name: 'ALLAHABAD',
                stateid: 34,
            },
            {
                id: 556,
                name: 'KAUSHAMBI',
                stateid: 34,
            },
            {
                id: 557,
                name: 'GHAZIPUR',
                stateid: 34,
            },
            {
                id: 558,
                name: 'JAUNPUR',
                stateid: 34,
            },
            {
                id: 559,
                name: 'MIRZAPUR',
                stateid: 34,
            },
            {
                id: 560,
                name: 'SONBHADRA',
                stateid: 34,
            },
            {
                id: 561,
                name: 'PRATAPGARH',
                stateid: 34,
            },
            {
                id: 562,
                name: 'VARANASI',
                stateid: 34,
            },
            {
                id: 563,
                name: 'CHANDAULI',
                stateid: 34,
            },
            {
                id: 564,
                name: 'SANT RAVIDAS NAGAR',
                stateid: 34,
            },
            {
                id: 565,
                name: 'BAREILLY',
                stateid: 34,
            },
            {
                id: 566,
                name: 'PILIBHIT',
                stateid: 34,
            },
            {
                id: 567,
                name: 'BIJNOR',
                stateid: 34,
            },
            {
                id: 568,
                name: 'BUDAUN',
                stateid: 34,
            },
            {
                id: 569,
                name: 'HARDOI',
                stateid: 34,
            },
            {
                id: 570,
                name: 'KHERI',
                stateid: 34,
            },
            {
                id: 571,
                name: 'MEERUT',
                stateid: 34,
            },
            {
                id: 572,
                name: 'BAGPAT',
                stateid: 34,
            },
            {
                id: 573,
                name: 'JYOTIBA PHULE NAGAR',
                stateid: 34,
            },
            {
                id: 574,
                name: 'MORADABAD',
                stateid: 34,
            },
            {
                id: 575,
                name: 'RAMPUR',
                stateid: 34,
            },
            {
                id: 576,
                name: 'MUZAFFARNAGAR',
                stateid: 34,
            },
            {
                id: 577,
                name: 'SAHARANPUR',
                stateid: 34,
            },
            {
                id: 578,
                name: 'MAU',
                stateid: 34,
            },
            {
                id: 579,
                name: 'BAHRAICH',
                stateid: 34,
            },
            {
                id: 580,
                name: 'SHRAWASTI',
                stateid: 34,
            },
            {
                id: 581,
                name: 'BALLIA',
                stateid: 34,
            },
            {
                id: 582,
                name: 'SANT KABIR NAGAR',
                stateid: 34,
            },
            {
                id: 583,
                name: 'SIDDHARTHNAGAR',
                stateid: 34,
            },
            {
                id: 584,
                name: 'BASTI',
                stateid: 34,
            },
            {
                id: 585,
                name: 'DEORIA',
                stateid: 34,
            },
            {
                id: 586,
                name: 'KUSHINAGAR',
                stateid: 34,
            },
            {
                id: 587,
                name: 'GONDA',
                stateid: 34,
            },
            {
                id: 588,
                name: 'BALRAMPUR',
                stateid: 34,
            },
            {
                id: 589,
                name: 'GORAKHPUR',
                stateid: 34,
            },
            {
                id: 590,
                name: 'MAHARAJGANJ',
                stateid: 34,
            },
            {
                id: 591,
                name: 'MAHOBA',
                stateid: 34,
            },
            {
                id: 592,
                name: 'BANDA',
                stateid: 34,
            },
            {
                id: 593,
                name: 'CHITRAKOOT',
                stateid: 34,
            },
            {
                id: 594,
                name: 'HAMIRPUR',
                stateid: 34,
            },
            {
                id: 595,
                name: 'KANNAUJ',
                stateid: 34,
            },
            {
                id: 596,
                name: 'FARRUKHABAD',
                stateid: 34,
            },
            {
                id: 597,
                name: 'FATEHPUR',
                stateid: 34,
            },
            {
                id: 598,
                name: 'KANPUR NAGAR',
                stateid: 34,
            },
            {
                id: 599,
                name: 'UNNAO',
                stateid: 34,
            },
            {
                id: 600,
                name: 'KANPUR DEHAT',
                stateid: 34,
            },
            {
                id: 601,
                name: 'BARABANKI',
                stateid: 34,
            },
            {
                id: 602,
                name: 'FAIZABAD',
                stateid: 34,
            },
            {
                id: 603,
                name: 'AMBEDKAR NAGAR',
                stateid: 34,
            },
            {
                id: 604,
                name: 'GHAZIABAD',
                stateid: 34,
            },
            {
                id: 605,
                name: 'LUCKNOW',
                stateid: 34,
            },
            {
                id: 606,
                name: 'RAEBARELI',
                stateid: 34,
            },
            {
                id: 607,
                name: 'SITAPUR',
                stateid: 34,
            },
            {
                id: 608,
                name: 'SULTANPUR',
                stateid: 34,
            },
            {
                id: 609,
                name: 'NOIDA',
                stateid: 34,
            },
            {
                id: 610,
                name: 'ORAI',
                stateid: 34,
            },
            {
                id: 611,
                name: 'HAPUR',
                stateid: 34,
            },
            {
                id: 612,
                name: 'HARIDWAR',
                stateid: 35,
            },
            {
                id: 613,
                name: 'ALMORA',
                stateid: 35,
            },
            {
                id: 614,
                name: 'BAGESHWAR',
                stateid: 35,
            },
            {
                id: 615,
                name: 'CHAMOLI',
                stateid: 35,
            },
            {
                id: 616,
                name: 'RUDRAPRAYAG',
                stateid: 35,
            },
            {
                id: 617,
                name: 'DEHRADUN',
                stateid: 35,
            },
            {
                id: 618,
                name: 'NAINITAL',
                stateid: 35,
            },
            {
                id: 619,
                name: 'UDHAM SINGH NAGAR',
                stateid: 35,
            },
            {
                id: 620,
                name: 'CHAMPAWAT',
                stateid: 35,
            },
            {
                id: 621,
                name: 'PAURI GARHWAL',
                stateid: 35,
            },
            {
                id: 622,
                name: 'PITHORAGARH',
                stateid: 35,
            },
            {
                id: 623,
                name: 'TEHRI GARHWAL',
                stateid: 35,
            },
            {
                id: 624,
                name: 'UTTARKASHI',
                stateid: 35,
            },
            {
                id: 625,
                name: 'KOLKATA',
                stateid: 36,
            },
            {
                id: 626,
                name: 'NORTH 24 PARGANAS',
                stateid: 36,
            },
            {
                id: 627,
                name: 'SOUTH 24 PARGANAS',
                stateid: 36,
            },
            {
                id: 628,
                name: 'BIRBHUM',
                stateid: 36,
            },
            {
                id: 629,
                name: 'MURSHIDABAD',
                stateid: 36,
            },
            {
                id: 630,
                name: 'NADIA',
                stateid: 36,
            },
            {
                id: 631,
                name: 'COOCH BEHAR',
                stateid: 36,
            },
            {
                id: 632,
                name: 'JALPAIGURI',
                stateid: 36,
            },
            {
                id: 633,
                name: 'DARJILING',
                stateid: 36,
            },
            {
                id: 634,
                name: 'MALDA',
                stateid: 36,
            },
            {
                id: 635,
                name: 'SOUTH DINAJPUR',
                stateid: 36,
            },
            {
                id: 636,
                name: 'NORTH DINAJPUR',
                stateid: 36,
            },
            {
                id: 637,
                name: 'BARDHAMAN',
                stateid: 36,
            },
            {
                id: 638,
                name: 'BANKURA',
                stateid: 36,
            },
            {
                id: 639,
                name: 'EAST MIDNAPORE',
                stateid: 36,
            },
            {
                id: 640,
                name: 'WEST MIDNAPORE',
                stateid: 36,
            },
            {
                id: 641,
                name: 'HOOGHLY',
                stateid: 36,
            },
            {
                id: 642,
                name: 'HOWRAH',
                stateid: 36,
            },
            {
                id: 643,
                name: 'MEDINIPUR',
                stateid: 36,
            },
            {
                id: 644,
                name: 'PURULIYA',
                stateid: 36,
            },
            {
                id: 646,
                name: 'RAJAMUNDHRY',
                stateid: 2,
            },
            {
                id: 647,
                name: 'JAGGAYAPETA',
                stateid: 2,
            },
            {
                id: 648,
                name: 'PODILI',
                stateid: 2,
            },
            {
                id: 649,
                name: 'PIDUGURALLA',
                stateid: 2,
            },
            {
                id: 650,
                name: 'NARASANAPETA',
                stateid: 2,
            },
            {
                id: 651,
                name: 'NUZVID',
                stateid: 2,
            },
            {
                id: 652,
                name: 'SIDDIPET',
                stateid: 2,
            },
            {
                id: 653,
                name: 'KAMAREDDY',
                stateid: 2,
            },
            {
                id: 654,
                name: 'ANAKAPALLY',
                stateid: 2,
            },
            {
                id: 655,
                name: 'PALAKOLLU',
                stateid: 2,
            },
            {
                id: 656,
                name: 'YELESWARAM',
                stateid: 2,
            },
            {
                id: 657,
                name: 'AMALAPURAM',
                stateid: 2,
            },
            {
                id: 658,
                name: 'HANUMAN JUNCTION',
                stateid: 2,
            },
            {
                id: 659,
                name: 'PUSAPATIREGA',
                stateid: 2,
            },
            {
                id: 660,
                name: 'V M BANJARA',
                stateid: 2,
            },
            {
                id: 661,
                name: 'MANGALAGIRI',
                stateid: 2,
            },
            {
                id: 662,
                name: 'BUCHIREDDYPALEM',
                stateid: 2,
            },
            {
                id: 663,
                name: 'PARVATHIPURAM',
                stateid: 2,
            },
            {
                id: 664,
                name: 'RAJAM',
                stateid: 2,
            },
            {
                id: 665,
                name: 'TEKKALI',
                stateid: 2,
            },
            {
                id: 666,
                name: 'REPALLE',
                stateid: 2,
            },
            {
                id: 667,
                name: 'MYLAVARAM',
                stateid: 2,
            },
            {
                id: 668,
                name: 'NANDIGAMA',
                stateid: 2,
            },
            {
                id: 669,
                name: 'PALWANCHA',
                stateid: 2,
            },
            {
                id: 670,
                name: 'PENDURTHI',
                stateid: 2,
            },
            {
                id: 671,
                name: 'NIDADAVOLU',
                stateid: 2,
            },
            {
                id: 672,
                name: 'SIRA',
                stateid: 2,
            },
            {
                id: 673,
                name: 'CHODAVARAM',
                stateid: 2,
            },
            {
                id: 674,
                name: 'INKILLU',
                stateid: 2,
            },
            {
                id: 675,
                name: 'INDUKURPETA',
                stateid: 2,
            },
            {
                id: 676,
                name: 'KANIGIRI',
                stateid: 2,
            },
            {
                id: 677,
                name: 'PAMURU',
                stateid: 2,
            },
            {
                id: 678,
                name: 'NARASARAOPET',
                stateid: 2,
            },
            {
                id: 679,
                name: 'PUNGANUR',
                stateid: 2,
            },
            {
                id: 680,
                name: 'TADEPALLIGUDEM',
                stateid: 2,
            },
            {
                id: 681,
                name: 'CHILAKALURIPETA',
                stateid: 2,
            },
            {
                id: 682,
                name: 'RAVULAPALEM',
                stateid: 2,
            },
            {
                id: 683,
                name: 'ANANTAPUR',
                stateid: 2,
            },
            {
                id: 684,
                name: 'KOVVURU',
                stateid: 2,
            },
            {
                id: 685,
                name: 'CHINTALAPUDI',
                stateid: 2,
            },
            {
                id: 686,
                name: 'MANDAPETA',
                stateid: 2,
            },
            {
                id: 687,
                name: 'TATIPAKA',
                stateid: 2,
            },
            {
                id: 688,
                name: 'TIRUPATI',
                stateid: 2,
            },
            {
                id: 689,
                name: 'KADIRI',
                stateid: 2,
            },
            {
                id: 690,
                name: 'KOTHAVALASA',
                stateid: 2,
            },
            {
                id: 691,
                name: 'NARSIPATNAM',
                stateid: 2,
            },
            {
                id: 692,
                name: 'ANANTHPUR',
                stateid: 2,
            },
            {
                id: 693,
                name: 'BHIMAVARAM',
                stateid: 2,
            },
            {
                id: 694,
                name: 'CHITTORE',
                stateid: 2,
            },
            {
                id: 695,
                name: 'CUDDAPH',
                stateid: 2,
            },
            {
                id: 696,
                name: 'CHIRALA',
                stateid: 2,
            },
            {
                id: 697,
                name: 'GUDUR',
                stateid: 2,
            },
            {
                id: 698,
                name: 'VINUKONDA',
                stateid: 2,
            },
            {
                id: 699,
                name: 'RAJUPALEM',
                stateid: 2,
            },
            {
                id: 700,
                name: 'KANDHUKURU',
                stateid: 2,
            },
            {
                id: 701,
                name: 'GANAPAVARAM',
                stateid: 2,
            },
            {
                id: 702,
                name: 'NARASAPURAM',
                stateid: 2,
            },
            {
                id: 703,
                name: 'PALASA',
                stateid: 2,
            },
            {
                id: 704,
                name: 'SATTENAPELLI',
                stateid: 2,
            },
            {
                id: 705,
                name: 'ANAPARTHI',
                stateid: 2,
            },
            {
                id: 706,
                name: 'NARAYANAPURAM',
                stateid: 2,
            },
            {
                id: 707,
                name: 'BOBBILI',
                stateid: 2,
            },
            {
                id: 708,
                name: 'SALURU',
                stateid: 2,
            },
            {
                id: 709,
                name: 'PAMIDI',
                stateid: 2,
            },
            {
                id: 710,
                name: 'GOOTY',
                stateid: 2,
            },
            {
                id: 711,
                name: 'ADONI',
                stateid: 2,
            },
            {
                id: 712,
                name: 'NANDIKOTKURU',
                stateid: 2,
            },
            {
                id: 713,
                name: 'KALYANADURGAM',
                stateid: 2,
            },
            {
                id: 714,
                name: 'PITHAPURAM',
                stateid: 2,
            },
            {
                id: 715,
                name: 'ELURU',
                stateid: 2,
            },
            {
                id: 716,
                name: 'KOLLURU',
                stateid: 2,
            },
            {
                id: 717,
                name: 'CHERUKUPALLI',
                stateid: 2,
            },
            {
                id: 718,
                name: 'PONNUR',
                stateid: 2,
            },
            {
                id: 719,
                name: 'ONGOLE',
                stateid: 2,
            },
            {
                id: 720,
                name: 'SULLURUPETA',
                stateid: 2,
            },
            {
                id: 721,
                name: 'MEDARAMETLA',
                stateid: 2,
            },
            {
                id: 722,
                name: 'DHARMAVARAM',
                stateid: 2,
            },
            {
                id: 723,
                name: 'TENALI',
                stateid: 2,
            },
            {
                id: 724,
                name: 'MARTURU',
                stateid: 2,
            },
            {
                id: 725,
                name: 'NAIDUPETA',
                stateid: 2,
            },
            {
                id: 726,
                name: 'GUDIVADA',
                stateid: 2,
            },
            {
                id: 727,
                name: 'PATTIKONDA',
                stateid: 2,
            },
            {
                id: 728,
                name: 'KAKINADA',
                stateid: 2,
            },
            {
                id: 729,
                name: 'MACHLIPATNAM',
                stateid: 2,
            },
            {
                id: 730,
                name: 'DHARMAPURAM',
                stateid: 2,
            },
            {
                id: 731,
                name: 'KAVALI',
                stateid: 2,
            },
            {
                id: 732,
                name: 'BIDHANNAGAR',
                stateid: 2,
            },
            {
                id: 733,
                name: 'ALLAGADDA',
                stateid: 2,
            },
            {
                id: 734,
                name: 'GUNTAKAL',
                stateid: 2,
            },
            {
                id: 735,
                name: 'ANANTPUR',
                stateid: 2,
            },
            {
                id: 736,
                name: 'NANDYAL',
                stateid: 2,
            },
            {
                id: 737,
                name: 'PRODDATTUR',
                stateid: 2,
            },
            {
                id: 738,
                name: 'TIRUPATHI',
                stateid: 2,
            },
            {
                id: 739,
                name: 'VIJAYNAGARAM',
                stateid: 2,
            },
            {
                id: 740,
                name: 'DACHEPALLI',
                stateid: 2,
            },
            {
                id: 741,
                name: 'MACHERLA',
                stateid: 2,
            },
            {
                id: 742,
                name: 'SANTHAMAGULUR',
                stateid: 2,
            },
            {
                id: 743,
                name: 'VIJAYWADA',
                stateid: 2,
            },
            {
                id: 744,
                name: 'TANUKU',
                stateid: 2,
            },
            {
                id: 745,
                name: 'BETAMCHERLA',
                stateid: 2,
            },
            {
                id: 746,
                name: 'GIDDALURU',
                stateid: 2,
            },
            {
                id: 747,
                name: 'CUMBUM',
                stateid: 2,
            },
            {
                id: 748,
                name: 'HINDUPUR',
                stateid: 2,
            },
            {
                id: 749,
                name: 'MARKAPUR',
                stateid: 2,
            },
            {
                id: 750,
                name: 'MADANAPALLE',
                stateid: 2,
            },
            {
                id: 751,
                name: 'TUNI',
                stateid: 2,
            },
            {
                id: 752,
                name: 'PRODDATUR',
                stateid: 2,
            },
            {
                id: 753,
                name: 'TADIPATRI',
                stateid: 2,
            },
            {
                id: 754,
                name: 'HAJIPUR',
                stateid: 2,
            },
            {
                id: 755,
                name: 'PALNADU',
                stateid: 2,
            },
            {
                id: 756,
                name: 'BANDERDEWA',
                stateid: 3,
            },
            {
                id: 757,
                name: 'GUWAHATI',
                stateid: 4,
            },
            {
                id: 758,
                name: 'DISPUR',
                stateid: 4,
            },
            {
                id: 759,
                name: 'MANGALDOI',
                stateid: 4,
            },
            {
                id: 760,
                name: 'MORIGAON',
                stateid: 4,
            },
            {
                id: 761,
                name: 'BIHTA',
                stateid: 5,
            },
            {
                id: 762,
                name: 'CHHAPRA',
                stateid: 5,
            },
            {
                id: 763,
                name: 'SASARAM',
                stateid: 5,
            },
            {
                id: 764,
                name: 'MOHANIA',
                stateid: 5,
            },
            {
                id: 765,
                name: 'NAUGACHIA',
                stateid: 5,
            },
            {
                id: 766,
                name: 'BAGAHA',
                stateid: 5,
            },
            {
                id: 767,
                name: 'FORBESGANJ',
                stateid: 5,
            },
            {
                id: 768,
                name: 'ZIRAKPUR',
                stateid: 6,
            },
            {
                id: 769,
                name: 'MEWAT',
                stateid: 6,
            },
            {
                id: 770,
                name: 'TILDA NEWRA',
                stateid: 7,
            },
            {
                id: 771,
                name: 'BEMETRA',
                stateid: 7,
            },
            {
                id: 772,
                name: 'RAJNANDGOAN',
                stateid: 7,
            },
            {
                id: 773,
                name: 'BALODABAZAR',
                stateid: 7,
            },
            {
                id: 774,
                name: 'GARIYABAND',
                stateid: 7,
            },
            {
                id: 775,
                name: 'BALOD',
                stateid: 7,
            },
            {
                id: 776,
                name: 'BHANUPRATAPPUR',
                stateid: 7,
            },
            {
                id: 777,
                name: 'SARAIPALI',
                stateid: 7,
            },
            {
                id: 778,
                name: 'PENDRA',
                stateid: 7,
            },
            {
                id: 779,
                name: 'MANENDRAGARH',
                stateid: 7,
            },
            {
                id: 780,
                name: 'JAGDALPUR',
                stateid: 7,
            },
            {
                id: 781,
                name: 'PATHALGAON',
                stateid: 7,
            },
            {
                id: 782,
                name: 'BAIKUNTHPUR',
                stateid: 7,
            },
            {
                id: 783,
                name: 'JANJGIR CHAMPA',
                stateid: 7,
            },
            {
                id: 784,
                name: 'KABIRDHAM',
                stateid: 7,
            },
            {
                id: 785,
                name: 'KONDAGOAN',
                stateid: 7,
            },
            {
                id: 786,
                name: 'MUNGELI',
                stateid: 7,
            },
            {
                id: 787,
                name: 'SUKMA',
                stateid: 7,
            },
            {
                id: 788,
                name: 'SURAJPUR',
                stateid: 7,
            },
            {
                id: 789,
                name: 'SILVASSA',
                stateid: 8,
            },
            {
                id: 790,
                name: 'PANAJI',
                stateid: 10,
            },
            {
                id: 791,
                name: 'DHOLKA',
                stateid: 11,
            },
            {
                id: 792,
                name: 'NADIAD',
                stateid: 11,
            },
            {
                id: 793,
                name: 'CHIKHODRA',
                stateid: 11,
            },
            {
                id: 794,
                name: 'HIMMATNAGAR',
                stateid: 11,
            },
            {
                id: 795,
                name: 'BOTAD',
                stateid: 11,
            },
            {
                id: 796,
                name: 'RADHANPUR',
                stateid: 11,
            },
            {
                id: 797,
                name: 'BODELI',
                stateid: 11,
            },
            {
                id: 798,
                name: 'RAJPIPLA',
                stateid: 11,
            },
            {
                id: 799,
                name: 'ANKLESHWAR',
                stateid: 11,
            },
            {
                id: 800,
                name: 'DHANERA',
                stateid: 11,
            },
            {
                id: 801,
                name: 'MAHUVA',
                stateid: 11,
            },
            {
                id: 802,
                name: 'RAPAR',
                stateid: 11,
            },
            {
                id: 803,
                name: 'GANDHIDHAM',
                stateid: 11,
            },
            {
                id: 804,
                name: 'VYARA',
                stateid: 11,
            },
            {
                id: 805,
                name: 'MUNDRA',
                stateid: 11,
            },
            {
                id: 806,
                name: 'VAPI',
                stateid: 11,
            },
            {
                id: 807,
                name: 'JAMKHAMBHALIYA',
                stateid: 11,
            },
            {
                id: 808,
                name: 'VERAVAL',
                stateid: 11,
            },
            {
                id: 809,
                name: 'BALLABHGARH',
                stateid: 12,
            },
            {
                id: 810,
                name: 'BAHADURGARH',
                stateid: 12,
            },
            {
                id: 811,
                name: 'PALWAL',
                stateid: 12,
            },
            {
                id: 812,
                name: 'NARNAUL',
                stateid: 12,
            },
            {
                id: 813,
                name: 'TOHANA',
                stateid: 12,
            },
            {
                id: 814,
                name: 'BADDI',
                stateid: 13,
            },
            {
                id: 815,
                name: 'Rampur Bushahr',
                stateid: 13,
            },
            {
                id: 816,
                name: 'KALA AMB',
                stateid: 13,
            },
            {
                id: 817,
                name: 'BANDIPORA',
                stateid: 14,
            },
            {
                id: 818,
                name: 'BOKARO STEEL CITY',
                stateid: 15,
            },
            {
                id: 819,
                name: 'CHAIBASA',
                stateid: 15,
            },
            {
                id: 820,
                name: 'GIRIDIH',
                stateid: 15,
            },
            {
                id: 821,
                name: 'PALAMU',
                stateid: 15,
            },
            {
                id: 822,
                name: 'BAHARAGORA',
                stateid: 15,
            },
            {
                id: 823,
                name: 'HUBLI',
                stateid: 16,
            },
            {
                id: 824,
                name: 'THARWAD',
                stateid: 16,
            },
            {
                id: 825,
                name: 'MANGALORE',
                stateid: 16,
            },
            {
                id: 826,
                name: 'PEENYA',
                stateid: 16,
            },
            {
                id: 827,
                name: 'DAVANAGERE',
                stateid: 16,
            },
            {
                id: 828,
                name: 'HOSPET',
                stateid: 16,
            },
            {
                id: 829,
                name: 'SINDHANUR',
                stateid: 16,
            },
            {
                id: 830,
                name: 'SAGARA',
                stateid: 16,
            },
            {
                id: 831,
                name: 'KUNDAPUR',
                stateid: 16,
            },
            {
                id: 832,
                name: 'YADAGIRI',
                stateid: 16,
            },
            {
                id: 833,
                name: 'KARWAR',
                stateid: 16,
            },
            {
                id: 834,
                name: 'BASAVAKALYAN',
                stateid: 16,
            },
            {
                id: 835,
                name: 'TRIVANDRUM',
                stateid: 17,
            },
            {
                id: 836,
                name: 'KAZHAKUTTAM',
                stateid: 17,
            },
            {
                id: 837,
                name: 'NEDUMANGAD',
                stateid: 17,
            },
            {
                id: 838,
                name: 'VENJARAMMOODU',
                stateid: 17,
            },
            {
                id: 839,
                name: 'NEYYATTINKARA',
                stateid: 17,
            },
            {
                id: 840,
                name: 'ATTINGAL',
                stateid: 17,
            },
            {
                id: 841,
                name: 'PARAVUR',
                stateid: 17,
            },
            {
                id: 842,
                name: 'PUNALUR',
                stateid: 17,
            },
            {
                id: 843,
                name: 'ADOOR',
                stateid: 17,
            },
            {
                id: 844,
                name: 'KARUNAGAPPALLY',
                stateid: 17,
            },
            {
                id: 845,
                name: 'CHENGANNUR',
                stateid: 17,
            },
            {
                id: 846,
                name: 'KAYAMKULAM',
                stateid: 17,
            },
            {
                id: 847,
                name: 'MAVELIKKARA',
                stateid: 17,
            },
            {
                id: 848,
                name: 'TIRUVALLA',
                stateid: 17,
            },
            {
                id: 849,
                name: 'THIRUVALLA',
                stateid: 17,
            },
            {
                id: 850,
                name: 'CHANGANASSERY',
                stateid: 17,
            },
            {
                id: 851,
                name: 'MALLAPPALLY',
                stateid: 17,
            },
            {
                id: 852,
                name: 'KANJIRAPALLY',
                stateid: 17,
            },
            {
                id: 853,
                name: 'PALA',
                stateid: 17,
            },
            {
                id: 854,
                name: 'CHERTHALA',
                stateid: 17,
            },
            {
                id: 855,
                name: 'VAIKOM',
                stateid: 17,
            },
            {
                id: 856,
                name: 'ERAMALLUR',
                stateid: 17,
            },
            {
                id: 857,
                name: 'VANDIPERIYAR',
                stateid: 17,
            },
            {
                id: 858,
                name: 'MUVATTUPUZHA',
                stateid: 17,
            },
            {
                id: 859,
                name: 'COCHIN',
                stateid: 17,
            },
            {
                id: 860,
                name: 'MATTANCHERRY',
                stateid: 17,
            },
            {
                id: 861,
                name: 'TRIPUNITHURA',
                stateid: 17,
            },
            {
                id: 862,
                name: 'KATTAPPANA',
                stateid: 17,
            },
            {
                id: 863,
                name: 'PERUMBAVOOR',
                stateid: 17,
            },
            {
                id: 864,
                name: 'ALUVA',
                stateid: 17,
            },
            {
                id: 865,
                name: 'KOTHAMANGALAM',
                stateid: 17,
            },
            {
                id: 866,
                name: 'ANGAMALY',
                stateid: 17,
            },
            {
                id: 867,
                name: 'KODUNGALLUR',
                stateid: 17,
            },
            {
                id: 868,
                name: 'IRINJALAKUDA',
                stateid: 17,
            },
            {
                id: 869,
                name: 'GURUVAYUR',
                stateid: 17,
            },
            {
                id: 870,
                name: 'VADAKKENCHERRY',
                stateid: 17,
            },
            {
                id: 871,
                name: 'PATTAMBI',
                stateid: 17,
            },
            {
                id: 872,
                name: 'OTTAPALAM',
                stateid: 17,
            },
            {
                id: 873,
                name: 'TIRUR',
                stateid: 17,
            },
            {
                id: 874,
                name: 'PERINTALMANNA',
                stateid: 17,
            },
            {
                id: 875,
                name: 'MANJERI',
                stateid: 17,
            },
            {
                id: 876,
                name: 'CALICUT',
                stateid: 17,
            },
            {
                id: 877,
                name: 'VADAKARA',
                stateid: 17,
            },
            {
                id: 878,
                name: 'KALPETTA',
                stateid: 17,
            },
            {
                id: 879,
                name: 'THALASSERY',
                stateid: 17,
            },
            {
                id: 880,
                name: 'TALIPARAMBA',
                stateid: 17,
            },
            {
                id: 881,
                name: 'KANHANGAD',
                stateid: 17,
            },
            {
                id: 882,
                name: 'BARELI',
                stateid: 20,
            },
            {
                id: 883,
                name: 'BIAORA',
                stateid: 20,
            },
            {
                id: 884,
                name: 'OZAR',
                stateid: 20,
            },
            {
                id: 885,
                name: 'MANDASAUR',
                stateid: 20,
            },
            {
                id: 886,
                name: 'UMARIYA',
                stateid: 20,
            },
            {
                id: 887,
                name: 'BAGLI',
                stateid: 20,
            },
            {
                id: 888,
                name: 'ANOOPUR',
                stateid: 20,
            },
            {
                id: 889,
                name: 'AGAR MALWA',
                stateid: 20,
            },
            {
                id: 890,
                name: 'SHIRPUR',
                stateid: 21,
            },
            {
                id: 891,
                name: 'Shahada',
                stateid: 21,
            },
            {
                id: 892,
                name: 'RAHATA',
                stateid: 21,
            },
            {
                id: 893,
                name: 'BORIVALI',
                stateid: 21,
            },
            {
                id: 894,
                name: 'PANVEL',
                stateid: 21,
            },
            {
                id: 895,
                name: 'BHIWANDI',
                stateid: 21,
            },
            {
                id: 896,
                name: 'DOMBIVLI',
                stateid: 21,
            },
            {
                id: 897,
                name: 'KALYAN',
                stateid: 21,
            },
            {
                id: 898,
                name: 'KHOPOLI',
                stateid: 21,
            },
            {
                id: 899,
                name: 'VASAI',
                stateid: 21,
            },
            {
                id: 900,
                name: 'PEN',
                stateid: 21,
            },
            {
                id: 901,
                name: 'SHAHAPUR',
                stateid: 21,
            },
            {
                id: 902,
                name: 'WADKHAL',
                stateid: 21,
            },
            {
                id: 903,
                name: 'PIMPRI CHINCHWAD',
                stateid: 21,
            },
            {
                id: 904,
                name: 'MAHAD',
                stateid: 21,
            },
            {
                id: 905,
                name: 'SHIKRAPUR',
                stateid: 21,
            },
            {
                id: 906,
                name: 'SINNAR',
                stateid: 21,
            },
            {
                id: 907,
                name: 'NARAYANGAON',
                stateid: 21,
            },
            {
                id: 908,
                name: 'PATAS',
                stateid: 21,
            },
            {
                id: 909,
                name: 'SANGAMNER',
                stateid: 21,
            },
            {
                id: 910,
                name: 'PHALTAN',
                stateid: 21,
            },
            {
                id: 911,
                name: 'KALWAN',
                stateid: 21,
            },
            {
                id: 912,
                name: 'KOPARGAON',
                stateid: 21,
            },
            {
                id: 913,
                name: 'YEOLA',
                stateid: 21,
            },
            {
                id: 914,
                name: 'BARAMATI',
                stateid: 21,
            },
            {
                id: 915,
                name: 'CHIPLUN',
                stateid: 21,
            },
            {
                id: 916,
                name: 'SHRIRAMPUR',
                stateid: 21,
            },
            {
                id: 917,
                name: 'VAIJAPUR',
                stateid: 21,
            },
            {
                id: 918,
                name: 'INDAPUR',
                stateid: 21,
            },
            {
                id: 919,
                name: 'MALEGAON',
                stateid: 21,
            },
            {
                id: 920,
                name: 'KARAD',
                stateid: 21,
            },
            {
                id: 921,
                name: 'AKLUJ',
                stateid: 21,
            },
            {
                id: 922,
                name: 'CHALISGAON',
                stateid: 21,
            },
            {
                id: 923,
                name: 'PANDHARPUR',
                stateid: 21,
            },
            {
                id: 924,
                name: 'BHOKARDAN',
                stateid: 21,
            },
            {
                id: 925,
                name: 'CHIKHALI',
                stateid: 21,
            },
            {
                id: 926,
                name: 'KANKAVALI',
                stateid: 21,
            },
            {
                id: 927,
                name: 'MALKAPUR',
                stateid: 21,
            },
            {
                id: 928,
                name: 'KHAMGAON',
                stateid: 21,
            },
            {
                id: 929,
                name: 'KUDAL',
                stateid: 21,
            },
            {
                id: 930,
                name: 'PUSAD',
                stateid: 21,
            },
            {
                id: 931,
                name: 'WANI',
                stateid: 21,
            },
            {
                id: 932,
                name: 'CHANDIKHOLE',
                stateid: 26,
            },
            {
                id: 933,
                name: 'JAJPURÃ‚Â ',
                stateid: 26,
            },
            {
                id: 934,
                name: 'PARADIP',
                stateid: 26,
            },
            {
                id: 935,
                name: 'KEONJHAR',
                stateid: 26,
            },
            {
                id: 936,
                name: 'BARBIL',
                stateid: 26,
            },
            {
                id: 937,
                name: 'PARALAKHEMUNDI',
                stateid: 26,
            },
            {
                id: 938,
                name: 'ROURKELA',
                stateid: 26,
            },
            {
                id: 939,
                name: 'SAINTALA',
                stateid: 26,
            },
            {
                id: 940,
                name: 'KHARIAR ROAD',
                stateid: 26,
            },
            {
                id: 941,
                name: 'JEYPORE',
                stateid: 26,
            },
            {
                id: 942,
                name: 'JAGATSINGHPUR',
                stateid: 26,
            },
            {
                id: 943,
                name: 'BARIPADA',
                stateid: 26,
            },
            {
                id: 944,
                name: 'BERHAMPUR',
                stateid: 26,
            },
            {
                id: 945,
                name: 'BHUBANESWAR',
                stateid: 26,
            },
            {
                id: 946,
                name: 'KHANNA',
                stateid: 28,
            },
            {
                id: 947,
                name: 'DASUYA',
                stateid: 28,
            },
            {
                id: 948,
                name: 'DERA BASSI',
                stateid: 28,
            },
            {
                id: 949,
                name: 'FEROZPUR',
                stateid: 28,
            },
            {
                id: 950,
                name: 'MUKERIAN',
                stateid: 28,
            },
            {
                id: 951,
                name: 'BATALA',
                stateid: 28,
            },
            {
                id: 952,
                name: 'CHOMU',
                stateid: 29,
            },
            {
                id: 953,
                name: 'PHULERA',
                stateid: 29,
            },
            {
                id: 954,
                name: 'SHAHPURA',
                stateid: 29,
            },
            {
                id: 955,
                name: 'KISHANGARH',
                stateid: 29,
            },
            {
                id: 956,
                name: 'KUCHAMAN',
                stateid: 29,
            },
            {
                id: 957,
                name: 'NEEM KA THANA',
                stateid: 29,
            },
            {
                id: 958,
                name: 'NASIRABAD',
                stateid: 29,
            },
            {
                id: 959,
                name: 'BEHROR',
                stateid: 29,
            },
            {
                id: 960,
                name: 'HINDAUN',
                stateid: 29,
            },
            {
                id: 961,
                name: 'SAWAIMADHOPUR',
                stateid: 29,
            },
            {
                id: 962,
                name: 'BEAWAR',
                stateid: 29,
            },
            {
                id: 963,
                name: 'SUJANGARH',
                stateid: 29,
            },
            {
                id: 964,
                name: 'MERTA CITY',
                stateid: 29,
            },
            {
                id: 965,
                name: 'BHIWADI',
                stateid: 29,
            },
            {
                id: 966,
                name: 'BIJOLIA',
                stateid: 29,
            },
            {
                id: 967,
                name: 'NOKHA',
                stateid: 29,
            },
            {
                id: 968,
                name: 'Lunkaransar',
                stateid: 29,
            },
            {
                id: 969,
                name: 'SUMERPUR',
                stateid: 29,
            },
            {
                id: 970,
                name: 'BALESAR',
                stateid: 29,
            },
            {
                id: 971,
                name: 'GHARSANA MANDI',
                stateid: 29,
            },
            {
                id: 972,
                name: 'BALOTRA',
                stateid: 29,
            },
            {
                id: 973,
                name: 'POKHRAN',
                stateid: 29,
            },
            {
                id: 974,
                name: 'BHINMAL',
                stateid: 29,
            },
            {
                id: 975,
                name: 'JALORE',
                stateid: 29,
            },
            {
                id: 976,
                name: 'NAINWA',
                stateid: 29,
            },
            {
                id: 977,
                name: 'NIMBAHERA',
                stateid: 29,
            },
            {
                id: 978,
                name: 'MALPURA',
                stateid: 29,
            },
            {
                id: 979,
                name: 'RATANGARH',
                stateid: 29,
            },
            {
                id: 980,
                name: 'TIRUVOTTIYUR',
                stateid: 31,
            },
            {
                id: 981,
                name: 'VELACHERY',
                stateid: 31,
            },
            {
                id: 982,
                name: 'AVADI',
                stateid: 31,
            },
            {
                id: 983,
                name: 'TAMBARAM',
                stateid: 31,
            },
            {
                id: 984,
                name: 'PONNERI',
                stateid: 31,
            },
            {
                id: 985,
                name: 'THIRUVALLUR',
                stateid: 31,
            },
            {
                id: 986,
                name: 'CHENGALPATTU',
                stateid: 31,
            },
            {
                id: 987,
                name: 'RANIPET',
                stateid: 31,
            },
            {
                id: 988,
                name: 'TIRUCHENGODE',
                stateid: 31,
            },
            {
                id: 989,
                name: 'GINGEE',
                stateid: 31,
            },
            {
                id: 990,
                name: 'VANIYAMBADI',
                stateid: 31,
            },
            {
                id: 991,
                name: 'NEYVELI',
                stateid: 31,
            },
            {
                id: 992,
                name: 'TIRUKOILUR',
                stateid: 31,
            },
            {
                id: 993,
                name: 'TIRUPATTUR',
                stateid: 31,
            },
            {
                id: 994,
                name: 'VIRUDHACHALAM',
                stateid: 31,
            },
            {
                id: 995,
                name: 'SIRKAZHI',
                stateid: 31,
            },
            {
                id: 996,
                name: 'KUMBAKONAM',
                stateid: 31,
            },
            {
                id: 997,
                name: 'ATTUR',
                stateid: 31,
            },
            {
                id: 998,
                name: 'THURAIYUR',
                stateid: 31,
            },
            {
                id: 999,
                name: 'THIRUVARUR',
                stateid: 31,
            },
            {
                id: 1000,
                name: 'SANKAGIRI',
                stateid: 31,
            },
            {
                id: 1001,
                name: 'KARAIKUDI',
                stateid: 31,
            },
            {
                id: 1002,
                name: 'GOBICHETTIPALAYAM',
                stateid: 31,
            },
            {
                id: 1003,
                name: 'TIRUPPUR',
                stateid: 31,
            },
            {
                id: 1004,
                name: 'PALANI',
                stateid: 31,
            },
            {
                id: 1005,
                name: 'PALLADAM',
                stateid: 31,
            },
            {
                id: 1006,
                name: 'POLLACHI',
                stateid: 31,
            },
            {
                id: 1007,
                name: 'SIVAKASI',
                stateid: 31,
            },
            {
                id: 1008,
                name: 'SRIVILLIPUTHUR',
                stateid: 31,
            },
            {
                id: 1009,
                name: 'RAJAPALAYAM',
                stateid: 31,
            },
            {
                id: 1010,
                name: 'GUDALUR',
                stateid: 31,
            },
            {
                id: 1011,
                name: 'VALPARAI',
                stateid: 31,
            },
            {
                id: 1012,
                name: 'TENKASI',
                stateid: 31,
            },
            {
                id: 1013,
                name: 'PANAKUDI',
                stateid: 31,
            },
            {
                id: 1014,
                name: 'NAGERCOIL',
                stateid: 31,
            },
            {
                id: 1015,
                name: 'MAYILADUTHURAI',
                stateid: 31,
            },
            {
                id: 1016,
                name: 'MAHABUB NAGAR',
                stateid: 32,
            },
            {
                id: 1017,
                name: 'SIDDIPET',
                stateid: 32,
            },
            {
                id: 1018,
                name: 'KAMAREDDY',
                stateid: 32,
            },
            {
                id: 1019,
                name: 'ARMOOR',
                stateid: 32,
            },
            {
                id: 1020,
                name: 'WANAPARTHY',
                stateid: 32,
            },
            {
                id: 1021,
                name: 'KOTHAGUDEM',
                stateid: 32,
            },
            {
                id: 1022,
                name: 'SANGAREDDY',
                stateid: 32,
            },
            {
                id: 1023,
                name: 'VIKARABAD',
                stateid: 32,
            },
            {
                id: 1024,
                name: 'BHADRACHALAM',
                stateid: 32,
            },
            {
                id: 1025,
                name: 'ZAHEERABAD',
                stateid: 32,
            },
            {
                id: 1026,
                name: 'MANCHERIAL',
                stateid: 32,
            },
            {
                id: 1027,
                name: 'KORUTLA',
                stateid: 32,
            },
            {
                id: 1028,
                name: 'NIRMAL',
                stateid: 32,
            },
            {
                id: 1029,
                name: 'GADWAL',
                stateid: 32,
            },
            {
                id: 1030,
                name: 'KHAMAM',
                stateid: 32,
            },
            {
                id: 1031,
                name: 'HUSNABAD',
                stateid: 32,
            },
            {
                id: 1032,
                name: 'JAMMIKUNTA',
                stateid: 32,
            },
            {
                id: 1033,
                name: 'ASIFABAD',
                stateid: 32,
            },
            {
                id: 1034,
                name: 'SECUNDERABAD',
                stateid: 32,
            },
            {
                id: 1035,
                name: 'MADHIRA',
                stateid: 32,
            },
            {
                id: 1036,
                name: 'MAHABUBABAD',
                stateid: 32,
            },
            {
                id: 1037,
                name: 'NARSAMPET',
                stateid: 32,
            },
            {
                id: 1038,
                name: 'PARKAL',
                stateid: 32,
            },
            {
                id: 1039,
                name: 'THORRUR',
                stateid: 32,
            },
            {
                id: 1040,
                name: 'WYRA',
                stateid: 32,
            },
            {
                id: 1041,
                name: 'MULUGU',
                stateid: 32,
            },
            {
                id: 1042,
                name: 'PATANCHERU',
                stateid: 32,
            },
            {
                id: 1043,
                name: 'PUSAPATIREGA',
                stateid: 32,
            },
            {
                id: 1044,
                name: 'MEHBOBNAGAR',
                stateid: 32,
            },
            {
                id: 1045,
                name: 'CHEVELLA',
                stateid: 32,
            },
            {
                id: 1046,
                name: 'KATHALAPUR',
                stateid: 32,
            },
            {
                id: 1047,
                name: 'PEDDAPALLY',
                stateid: 32,
            },
            {
                id: 1048,
                name: 'NEREDUCHERLA',
                stateid: 32,
            },
            {
                id: 1049,
                name: 'MUNAGALA',
                stateid: 32,
            },
            {
                id: 1050,
                name: 'SIRCILLA',
                stateid: 32,
            },
            {
                id: 1051,
                name: 'KEESARA',
                stateid: 32,
            },
            {
                id: 1052,
                name: 'BELLAMPALLY',
                stateid: 32,
            },
            {
                id: 1053,
                name: 'MANDAMARRI',
                stateid: 32,
            },
            {
                id: 1054,
                name: 'NARAYANPET',
                stateid: 32,
            },
            {
                id: 1055,
                name: 'MIRYALGUDA',
                stateid: 32,
            },
            {
                id: 1056,
                name: 'BANSWADA',
                stateid: 32,
            },
            {
                id: 1057,
                name: 'SURYAPET',
                stateid: 32,
            },
            {
                id: 1058,
                name: 'MIRYALAGUDA',
                stateid: 32,
            },
            {
                id: 1059,
                name: 'TANDUR',
                stateid: 32,
            },
            {
                id: 1060,
                name: 'KODAD',
                stateid: 32,
            },
            {
                id: 1061,
                name: 'SHAHJAHANPUR',
                stateid: 34,
            },
            {
                id: 1062,
                name: 'BEWAR',
                stateid: 34,
            },
            {
                id: 1063,
                name: 'SONEBHDRA',
                stateid: 34,
            },
            {
                id: 1064,
                name: 'GREATER NOIDA',
                stateid: 34,
            },
            {
                id: 1065,
                name: 'SAHIBABAD',
                stateid: 34,
            },
            {
                id: 1066,
                name: 'BAGHPAT',
                stateid: 34,
            },
            {
                id: 1067,
                name: 'BARAUT',
                stateid: 34,
            },
            {
                id: 1068,
                name: 'PADRAUNA',
                stateid: 34,
            },
            {
                id: 1069,
                name: 'AMETHI',
                stateid: 34,
            },
            {
                id: 1070,
                name: 'BADAUN',
                stateid: 34,
            },
            {
                id: 1071,
                name: 'BHADOHI',
                stateid: 34,
            },
            {
                id: 1072,
                name: 'SAMBHAL',
                stateid: 34,
            },
            {
                id: 1073,
                name: 'SHAMLI',
                stateid: 34,
            },
            {
                id: 1074,
                name: 'SHRAVASTI',
                stateid: 34,
            },
            {
                id: 1075,
                name: 'HAMIRPUR (UP)',
                stateid: 34,
            },
            {
                id: 1076,
                name: 'AMROHA',
                stateid: 34,
            },
            {
                id: 1077,
                name: 'KANSHI RAM NAGAR',
                stateid: 34,
            },
            {
                id: 1078,
                name: 'MAHAMAYA NAGAR',
                stateid: 34,
            },
            {
                id: 1079,
                name: 'RISHIKESH',
                stateid: 35,
            },
            {
                id: 1080,
                name: 'ROORKEE',
                stateid: 35,
            },
            {
                id: 1081,
                name: 'KASHIPUR',
                stateid: 35,
            },
            {
                id: 1082,
                name: 'KHATIMA',
                stateid: 35,
            },
            {
                id: 1083,
                name: 'BARRACKPORE',
                stateid: 36,
            },
            {
                id: 1084,
                name: 'BARUIPUR',
                stateid: 36,
            },
            {
                id: 1085,
                name: 'CHANDANNAGAR',
                stateid: 36,
            },
            {
                id: 1086,
                name: 'BASIRHAT',
                stateid: 36,
            },
            {
                id: 1087,
                name: 'MEMARI',
                stateid: 36,
            },
            {
                id: 1088,
                name: 'TAMLUK',
                stateid: 36,
            },
            {
                id: 1089,
                name: 'BURDWAN',
                stateid: 36,
            },
            {
                id: 1090,
                name: 'KRISHNANAGAR',
                stateid: 36,
            },
            {
                id: 1091,
                name: 'CONTAI',
                stateid: 36,
            },
            {
                id: 1092,
                name: 'DURGAPUR',
                stateid: 36,
            },
            {
                id: 1093,
                name: 'ASANSOL',
                stateid: 36,
            },
            {
                id: 1094,
                name: 'BAHARAMPUR',
                stateid: 36,
            },
            {
                id: 1095,
                name: 'BEHARAMPUR',
                stateid: 36,
            },
            {
                id: 1096,
                name: 'RAGHUNATHGANJ',
                stateid: 36,
            },
            {
                id: 1097,
                name: 'RAIGANJ',
                stateid: 36,
            },
            {
                id: 1098,
                name: 'DALKHOLA',
                stateid: 36,
            },
            {
                id: 1099,
                name: 'ISLAMPUR',
                stateid: 36,
            },
            {
                id: 1100,
                name: 'HALDIA',
                stateid: 36,
            },
            {
                id: 1101,
                name: 'DELHI',
                stateid: 0,
            },
            {
                id: 1102,
                name: 'GANGTOK',
                stateid: 0,
            },
            {
                id: 1103,
                name: 'SHILLONG',
                stateid: 0,
            },
            {
                id: 1104,
                name: 'AGARTALA',
                stateid: 0,
            },
            {
                id: 1105,
                name: 'BHUBANESHWAR',
                stateid: 0,
            },
            {
                id: 1106,
                name: 'PUDUCHERRY',
                stateid: 0,
            },
            {
                id: 1107,
                name: 'ITANAGAR',
                stateid: 0,
            },
            {
                id: 1108,
                name: 'PORT BLAIR',
                stateid: 0,
            },
            {
                id: 1109,
                name: 'IMPHAL',
                stateid: 0,
            },
            {
                id: 1110,
                name: 'DAMAN AND DIU',
                stateid: 0,
            },
            {
                id: 1111,
                name: 'VIJAYAWADA',
                stateid: 0,
            },
        ],
        DataDetails: null,
        TotalCount: 0,
    },
};
