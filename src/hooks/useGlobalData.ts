
import { useLocalStorage } from './useLocalStorage';

export interface VendorData {
  vendorInfo: any;
  riskAssessment: any;
  officialVerification: any;
  uploadedFiles: any[];
}

export interface AcquirerData {
  acquirerInfo: any;
  riskAssessment: any;
  officialVerification: any;
  uploadedFiles: any[];
}

export interface FundOriginData {
  fundOriginInfo: any;
  riskAssessment: any;
  uploadedFiles: any[];
}

export interface GlobalAppData {
  vendor: VendorData;
  acquirer: AcquirerData;
  fundOrigin: FundOriginData;
  summary: {
    assessments: any;
    totalScore: number;
    overallRisk: string;
    documentInfo: any;
  };
  transactionInfo: {
    transactionType: string;
    propertyType: string;
  };
}

export const useGlobalData = () => {
  const [globalData, setGlobalData] = useLocalStorage<GlobalAppData>('tracfinGlobalData', {
    vendor: {
      vendorInfo: {},
      riskAssessment: {},
      officialVerification: {},
      uploadedFiles: []
    },
    acquirer: {
      acquirerInfo: {},
      riskAssessment: {},
      officialVerification: {},
      uploadedFiles: []
    },
    fundOrigin: {
      fundOriginInfo: {},
      riskAssessment: {},
      uploadedFiles: []
    },
    summary: {
      assessments: {
        vendor: { score: 0, level: 'Faible' },
        acquirer: { score: 0, level: 'Faible' },
        fundOrigin: { score: 0, level: 'Faible' }
      },
      totalScore: 0,
      overallRisk: 'Faible',
      documentInfo: {}
    },
    transactionInfo: {
      transactionType: '',
      propertyType: ''
    }
  });

  const updateVendorData = (data: Partial<VendorData>) => {
    setGlobalData(prev => ({
      ...prev,
      vendor: { ...prev.vendor, ...data }
    }));
  };

  const updateAcquirerData = (data: Partial<AcquirerData>) => {
    setGlobalData(prev => ({
      ...prev,
      acquirer: { ...prev.acquirer, ...data }
    }));
  };

  const updateFundOriginData = (data: Partial<FundOriginData>) => {
    setGlobalData(prev => ({
      ...prev,
      fundOrigin: { ...prev.fundOrigin, ...data }
    }));
  };

  const updateSummaryData = (data: any) => {
    setGlobalData(prev => ({
      ...prev,
      summary: { ...prev.summary, ...data }
    }));
  };

  const updateTransactionInfo = (data: any) => {
    setGlobalData(prev => ({
      ...prev,
      transactionInfo: { ...prev.transactionInfo, ...data }
    }));
  };

  return {
    globalData,
    updateVendorData,
    updateAcquirerData,
    updateFundOriginData,
    updateSummaryData,
    updateTransactionInfo,
    setGlobalData
  };
};
