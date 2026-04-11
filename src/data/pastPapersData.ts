export interface PaperMetadata {
  id: string;
  title: string;
  fileName: string;
  subject: string;
  year: number;
  level: 'Primary' | 'S3' | 'S6';
  isNursery?: boolean;
}

export const PAST_PAPERS_DATA: PaperMetadata[] = [
  // Nursery / Pre-Primary
  { id: 'nur-1', title: 'Nursery Activity 1', fileName: '2016_1-Nursery.pdf', subject: 'Activity', year: 2016, level: 'Primary', isNursery: true },
  { id: 'nur-2', title: 'Nursery Activity 2', fileName: '2016_2-Nursery.pdf', subject: 'Activity', year: 2016, level: 'Primary', isNursery: true },
  { id: 'nur-3', title: 'Nursery Activity 3', fileName: '2016_3-Nursery.pdf', subject: 'Activity', year: 2016, level: 'Primary', isNursery: true },
  { id: 'nur-4', title: 'Nursery Activity 4', fileName: '2016_4-Nursery.pdf', subject: 'Activity', year: 2016, level: 'Primary', isNursery: true },
  { id: 'nur-5', title: 'Nursery Activity 5', fileName: '2016_5-Nursery.pdf', subject: 'Activity', year: 2016, level: 'Primary', isNursery: true },
  { id: 'nur-6', title: 'Nursery Activity 6', fileName: '2016_6-Nursery.pdf', subject: 'Activity', year: 2016, level: 'Primary', isNursery: true },
  { id: 'nur-7', title: 'Nursery Activity 7', fileName: '2016_7-Nursery.pdf', subject: 'Activity', year: 2016, level: 'Primary', isNursery: true },
  { id: 'nur-9', title: 'Nursery Activity 9', fileName: '2016_9-Nursery.pdf', subject: 'Activity', year: 2016, level: 'Primary', isNursery: true },
  { id: 'nur-10', title: 'Nursery Activity 10', fileName: '2016_10-Nursery.pdf', subject: 'Activity', year: 2016, level: 'Primary', isNursery: true },

  // Primary (P6 / General)
  { id: 'p6-2018-is', title: 'Integrated Sciences', fileName: '2018 Integrated Sciences Past Paper.pdf', subject: 'Integrated Sciences', year: 2018, level: 'Primary' },
  { id: 'p6-2021-mi', title: 'Ikinyarwanda', fileName: '2021 Ikinyarwanda Past Paper.pdf', subject: 'Ikinyarwanda', year: 2021, level: 'Primary' },
  { id: 'p6-2021-m', title: 'Mathematics', fileName: '2021 Mathematics Past Paper.pdf', subject: 'Mathematics', year: 2021, level: 'Primary' },
  { id: 'p6-2021-set', title: 'Science & Elementary Technology', fileName: '2021 Science _ Elementary Technology Past Paper.pdf', subject: 'SET', year: 2021, level: 'Primary' },
  { id: 'p6-2021-srs', title: 'Social Religious Studies', fileName: '2021 Social Religious Studies Past Paper.pdf', subject: 'Social Religious Studies', year: 2021, level: 'Primary' },
  { id: 'p6-2022-e', title: 'English', fileName: '2022 English Past Paper.pdf', subject: 'English', year: 2022, level: 'Primary' },
  { id: 'p6-2022-f', title: 'Francais', fileName: '2022 Francais Past Paper.pdf', subject: 'Francais', year: 2022, level: 'Primary' },
  { id: 'p6-2022-i', title: 'Ikinyarwanda', fileName: '2022 Ikinyarwanda Past Paper.pdf', subject: 'Ikinyarwanda', year: 2022, level: 'Primary' },
  { id: 'p6-2022-m', title: 'Mathematics', fileName: '2022 Mathematics Past Paper.pdf', subject: 'Mathematics', year: 2022, level: 'Primary' },
  { id: 'p6-2022-set', title: 'Science & Elementary Technology', fileName: '2022 Science & Elementary Technology Past Paper.pdf', subject: 'SET', year: 2022, level: 'Primary' },
  { id: 'p6-2022-srs', title: 'Social Religious Studies', fileName: '2022 Social Religious Studies Past Paper.pdf', subject: 'Social Religious Studies', year: 2022, level: 'Primary' },
  { id: 'p6-2023-e', title: 'English', fileName: '2023 English Past Paper.pdf', subject: 'English', year: 2023, level: 'Primary' },
  { id: 'p6-2023-f', title: 'Francais', fileName: '2023 Francais Past Paper.pdf', subject: 'Francais', year: 2023, level: 'Primary' },
  { id: 'p6-2023-i', title: 'Ikinyarwanda', fileName: '2023 Ikinyarwanda Past Paper.pdf', subject: 'Ikinyarwanda', year: 2023, level: 'Primary' },
  { id: 'p6-2023-m', title: 'Mathematics', fileName: '2023 Mathematics Past Paper.pdf', subject: 'Mathematics', year: 2023, level: 'Primary' },
  { id: 'p6-2023-set', title: 'SET', fileName: '2023 SET Past Paper.pdf', subject: 'SET', year: 2023, level: 'Primary' },
  { id: 'p6-2023-sre', title: 'SRE', fileName: '2023 SRE Past Paper.pdf', subject: 'SRE', year: 2023, level: 'Primary' },

  // Secondary S3 (Ordinary Level) - Identified by 'I'
  { id: 's3-2021-ei', title: 'Economics I', fileName: '2021 Economics I Past Paper.pdf', subject: 'Economics', year: 2021, level: 'S3' },
  { id: 's3-2022-ei', title: 'Economics I', fileName: '2022 Economics I Past Paper.pdf', subject: 'Economics', year: 2022, level: 'S3' },
  { id: 's3-2023-ei', title: 'Economics I', fileName: '2023 Economics I Past Paper.pdf', subject: 'Economics', year: 2023, level: 'S3' },

  // Secondary S6 (Advanced Level) - Identified by 'II' and 'III'
  { id: 's6-2016-eii', title: 'Economics II', fileName: '2016 Economics II Past Paper.pdf', subject: 'Economics', year: 2016, level: 'S6' },
  { id: 's6-2021-bh', title: 'Biology health Sciences', fileName: '2021 Biology Health Sciences Past Paper.pdf', subject: 'Biology', year: 2021, level: 'S6' },
  { id: 's6-2021-cii', title: 'Chemistry II', fileName: '2021 Chemistry II Past Paper.pdf', subject: 'Chemistry', year: 2021, level: 'S6' },
  { id: 's6-2021-f', title: 'Francais', fileName: '2021 Francais Past Paper.pdf', subject: 'Francais', year: 2021, level: 'S6' },
  { id: 's6-2021-gp', title: 'General Paper', fileName: '2021 General Paper Past Paper.pdf', subject: 'General Paper', year: 2021, level: 'S6' },
  { id: 's6-2021-giii', title: 'Geography III', fileName: '2021 Geography III Past Paper.pdf', subject: 'Geography', year: 2021, level: 'S6' },
  { id: 's6-2021-giv', title: 'Geography IV', fileName: '2021 Geography IV Past Paper.pdf', subject: 'Geography', year: 2021, level: 'S6' },
  { id: 's6-2021-hiii', title: 'History III', fileName: '2021 History III Past Paper.pdf', subject: 'History', year: 2021, level: 'S6' },
  { id: 's6-2021-hiv', title: 'History IV', fileName: '2021 History IV Past Paper.pdf', subject: 'History', year: 2021, level: 'S6' },
  { id: 's6-2021-mii', title: 'Mathematics II', fileName: '2021 Mathematics II Past Paper.pdf', subject: 'Mathematics', year: 2021, level: 'S6' },
  { id: 's6-2021-pii', title: 'Physics II', fileName: '2021 Physics II Past Paper.pdf', subject: 'Physics', year: 2021, level: 'S6' },
  { id: 's6-2021-piii', title: 'Physics III', fileName: '2021 Physics III Past Paper.pdf', subject: 'Physics', year: 2021, level: 'S6' },
  { id: 's6-2022-bh', title: 'Biology health Sciences', fileName: '2022 Biology Health Sciences Past Paper.pdf', subject: 'Biology', year: 2022, level: 'S6' },
  { id: 's6-2022-bii', title: 'Biology II', fileName: '2022 Biology II Past Paper.pdf', subject: 'Biology', year: 2022, level: 'S6' },
  { id: 's6-2022-biii', title: 'Biology III', fileName: '2022 Biology III Past Paper.pdf', subject: 'Biology', year: 2022, level: 'S6' },
  { id: 's6-2022-cii', title: 'Chemistry II', fileName: '2022 Chemistry II Past Paper.pdf', subject: 'Chemistry', year: 2022, level: 'S6' },
  { id: 's6-2022-eii', title: 'Economics II', fileName: '2022 Economics II Past Paper.pdf', subject: 'Economics', year: 2022, level: 'S6' },
  { id: 's6-2022-gp', title: 'General Paper', fileName: '2022 General Paper Past Paper.pdf', subject: 'General Paper', year: 2022, level: 'S6' },
  { id: 's6-2022-giii', title: 'Geography III', fileName: '2022 Geography III Past Paper.pdf', subject: 'Geography', year: 2022, level: 'S6' },
  { id: 's6-2022-giv', title: 'Geography IV', fileName: '2022 Geography IV Past Paper.pdf', subject: 'Geography', year: 2022, level: 'S6' },
  { id: 's6-2022-hiv', title: 'History IV', fileName: '2022 History IV Past Paper.pdf', subject: 'History', year: 2022, level: 'S6' },
  { id: 's6-2022-mii', title: 'Mathematics II', fileName: '2022 Mathematics II Past Paper.pdf', subject: 'Mathematics', year: 2022, level: 'S6' },
  { id: 's6-2022-piii', title: 'Physics III', fileName: '2022 Physics III Past Paper.pdf', subject: 'Physics', year: 2022, level: 'S6' },
  { id: 's6-2023-bh', title: 'Biology health Sciences', fileName: '2023 Biology Health Sciences Past Paper.pdf', subject: 'Biology', year: 2023, level: 'S6' },
  { id: 's6-2023-bii', title: 'Biology II', fileName: '2023 Biology II Past Paper.pdf', subject: 'Biology', year: 2023, level: 'S6' },
  { id: 's6-2023-biii', title: 'Biology III', fileName: '2023 Biology III Past Paper.pdf', subject: 'Biology', year: 2023, level: 'S6' },
  { id: 's6-2023-cii', title: 'Chemistry II', fileName: '2023 Chemistry II Past Paper.pdf', subject: 'Chemistry', year: 2023, level: 'S6' },
  { id: 's6-2023-gp', title: 'General Paper', fileName: '2023 General Paper Past Paper.pdf', subject: 'General Paper', year: 2023, level: 'S6' },
  { id: 's6-2023-giii', title: 'Geography III', fileName: '2023 Geography III Past Paper.pdf', subject: 'Geography', year: 2023, level: 'S6' },
  { id: 's6-2023-giv', title: 'Geography IV', fileName: '2023 Geography IV Past Paper.pdf', subject: 'Geography', year: 2023, level: 'S6' },
  { id: 's6-2023-hiii', title: 'History III', fileName: '2023 History III Past Paper.pdf', subject: 'History', year: 2023, level: 'S6' },
  { id: 's6-2023-hiv', title: 'History IV', fileName: '2023 History IV Past Paper.pdf', subject: 'History', year: 2023, level: 'S6' },
  { id: 's6-2023-mii', title: 'Mathematics II', fileName: '2023 Mathematics II Past Paper.pdf', subject: 'Mathematics', year: 2023, level: 'S6' },
  { id: 's6-2023-pii', title: 'Physics II', fileName: '2023 Physics II Past Paper.pdf', subject: 'Physics', year: 2023, level: 'S6' },
  { id: 's6-2023-piii', title: 'Physics III', fileName: '2023 Physics III Past Paper.pdf', subject: 'Physics', year: 2023, level: 'S6' },
];
