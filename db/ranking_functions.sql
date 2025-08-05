-- テスト平均点を取得する関数
CREATE OR REPLACE FUNCTION get_test_averages(
  p_test_name TEXT,
  p_test_date DATE
)
RETURNS TABLE (
  avg_section_a NUMERIC,
  avg_section_b NUMERIC,
  avg_section_c NUMERIC,
  avg_section_d NUMERIC,
  avg_section_ad NUMERIC,
  avg_section_bc NUMERIC,
  avg_total_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    AVG(section_a) as avg_section_a,
    AVG(section_b) as avg_section_b,
    AVG(section_c) as avg_section_c,
    AVG(section_d) as avg_section_d,
    AVG(section_ad) as avg_section_ad,
    AVG(section_bc) as avg_section_bc,
    AVG(total_score) as avg_total_score
  FROM 
    test_scores
  WHERE 
    test_name = p_test_name
    AND test_date = p_test_date;
END;
$$ LANGUAGE plpgsql;

-- 学生の個別テストでの順位を取得する関数
CREATE OR REPLACE FUNCTION get_student_rank(
  p_student_id TEXT,
  p_test_name TEXT,
  p_test_date DATE
)
RETURNS TABLE (
  rank INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH test_rankings AS (
    SELECT 
      ts.student_id,
      RANK() OVER (ORDER BY ts.total_score DESC)::INTEGER as rank
    FROM test_scores ts
    WHERE ts.test_name = p_test_name 
      AND ts.test_date = p_test_date
  )
  SELECT tr.rank
  FROM test_rankings tr
  WHERE tr.student_id = p_student_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 学生の総合順位を取得する関数
CREATE OR REPLACE FUNCTION get_student_total_rank(
  p_student_id TEXT
)
RETURNS TABLE (
  rank INTEGER,
  avg_rank NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH student_averages AS (
    SELECT 
      ts.student_id,
      AVG(ts.total_score) as avg_total_score
    FROM test_scores ts
    GROUP BY ts.student_id
    HAVING COUNT(*) > 0
  ),
  student_rankings AS (
    SELECT 
      sa.student_id,
      sa.avg_total_score,
      RANK() OVER (ORDER BY sa.avg_total_score DESC)::INTEGER as rank
    FROM student_averages sa
  )
  SELECT 
    sr.rank,
    sr.avg_total_score as avg_rank
  FROM student_rankings sr
  WHERE sr.student_id = p_student_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 特定のテストの全学生の順位を取得する関数
CREATE OR REPLACE FUNCTION get_test_rankings(
  p_test_name TEXT,
  p_test_date DATE
)
RETURNS TABLE (
  id UUID,
  student_id TEXT,
  name TEXT,
  test_name TEXT,
  test_date DATE,
  section_a INTEGER,
  section_b INTEGER,
  section_c INTEGER,
  section_d INTEGER,
  section_ad INTEGER,
  section_bc INTEGER,
  total_score INTEGER,
  created_at TIMESTAMPTZ,
  rank INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ts.id,
    ts.student_id,
    ts.name,
    ts.test_name,
    ts.test_date,
    ts.section_a,
    ts.section_b,
    ts.section_c,
    ts.section_d,
    ts.section_ad,
    ts.section_bc,
    ts.total_score,
    ts.created_at,
    RANK() OVER (ORDER BY ts.total_score DESC)::INTEGER as rank
  FROM test_scores ts
  WHERE ts.test_name = p_test_name 
    AND ts.test_date = p_test_date
  ORDER BY ts.total_score DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 総合ランキングを取得する関数
CREATE OR REPLACE FUNCTION get_total_rankings()
RETURNS TABLE (
  student_id TEXT,
  name TEXT,
  avg_total_score NUMERIC,
  test_count INTEGER,
  rank INTEGER,
  avg_rank NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH student_averages AS (
    SELECT 
      ts.student_id,
      ts.name,
      AVG(ts.total_score) as avg_total_score,
      COUNT(*) as test_count
    FROM test_scores ts
    GROUP BY ts.student_id, ts.name
    HAVING COUNT(*) > 0
  ),
  student_avg_ranks AS (
    SELECT 
      sa.student_id,
      sa.name,
      sa.avg_total_score,
      sa.test_count,
      RANK() OVER (ORDER BY sa.avg_total_score DESC)::INTEGER as rank,
      sa.avg_total_score as avg_rank
    FROM student_averages sa
  )
  SELECT * FROM student_avg_ranks
  ORDER BY rank;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
