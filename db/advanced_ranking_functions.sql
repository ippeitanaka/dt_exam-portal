-- 統計情報を含むテスト分析機能
CREATE OR REPLACE FUNCTION get_test_analytics(p_test_name TEXT, p_test_date DATE)
RETURNS TABLE (
  total_students INTEGER,
  avg_score NUMERIC,
  max_score INTEGER,
  min_score INTEGER,
  passing_count INTEGER,
  passing_rate NUMERIC,
  avg_section_a NUMERIC,
  avg_section_b NUMERIC,
  avg_section_c NUMERIC,
  avg_section_d NUMERIC,
  avg_section_ad NUMERIC,
  avg_section_bc NUMERIC,
  std_dev NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_students,
    AVG(ts.total_score) as avg_score,
    MAX(ts.total_score) as max_score,
    MIN(ts.total_score) as min_score,
    COUNT(CASE WHEN ts.section_ad >= 132 AND ts.section_bc >= 44 THEN 1 END)::INTEGER as passing_count,
    (COUNT(CASE WHEN ts.section_ad >= 132 AND ts.section_bc >= 44 THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC * 100) as passing_rate,
    AVG(ts.section_a) as avg_section_a,
    AVG(ts.section_b) as avg_section_b,
    AVG(ts.section_c) as avg_section_c,
    AVG(ts.section_d) as avg_section_d,
    AVG(ts.section_ad) as avg_section_ad,
    AVG(ts.section_bc) as avg_section_bc,
    STDDEV_POP(ts.total_score) as std_dev
  FROM test_scores ts
  WHERE ts.test_name = p_test_name 
    AND ts.test_date = p_test_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 偏差値計算機能
CREATE OR REPLACE FUNCTION get_test_rankings_with_deviation(p_test_name TEXT, p_test_date DATE)
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
  rank INTEGER,
  deviation_score NUMERIC
) AS $$
DECLARE
  avg_score NUMERIC;
  std_dev NUMERIC;
BEGIN
  -- 平均点と標準偏差を計算
  SELECT AVG(ts.total_score), STDDEV_POP(ts.total_score)
  INTO avg_score, std_dev
  FROM test_scores ts
  WHERE ts.test_name = p_test_name 
    AND ts.test_date = p_test_date;

  -- 標準偏差が0の場合（全員同じ点数）のハンドリング
  IF std_dev = 0 OR std_dev IS NULL THEN
    std_dev := 1;
  END IF;

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
    RANK() OVER (ORDER BY ts.total_score DESC)::INTEGER as rank,
    ROUND(50 + (ts.total_score - avg_score) * 10 / std_dev, 1) as deviation_score
  FROM test_scores ts
  WHERE ts.test_name = p_test_name 
    AND ts.test_date = p_test_date
  ORDER BY ts.total_score DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 分野別ランキング（セクションA）
CREATE OR REPLACE FUNCTION get_section_a_rankings(p_test_name TEXT, p_test_date DATE)
RETURNS TABLE (
  id UUID,
  student_id TEXT,
  name TEXT,
  section_a INTEGER,
  rank INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ts.id,
    ts.student_id,
    ts.name,
    ts.section_a,
    RANK() OVER (ORDER BY ts.section_a DESC)::INTEGER as rank
  FROM test_scores ts
  WHERE ts.test_name = p_test_name 
    AND ts.test_date = p_test_date
  ORDER BY ts.section_a DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 分野別ランキング（セクションB）
CREATE OR REPLACE FUNCTION get_section_b_rankings(p_test_name TEXT, p_test_date DATE)
RETURNS TABLE (
  id UUID,
  student_id TEXT,
  name TEXT,
  section_b INTEGER,
  rank INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ts.id,
    ts.student_id,
    ts.name,
    ts.section_b,
    RANK() OVER (ORDER BY ts.section_b DESC)::INTEGER as rank
  FROM test_scores ts
  WHERE ts.test_name = p_test_name 
    AND ts.test_date = p_test_date
  ORDER BY ts.section_b DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 分野別ランキング（セクションC）
CREATE OR REPLACE FUNCTION get_section_c_rankings(p_test_name TEXT, p_test_date DATE)
RETURNS TABLE (
  id UUID,
  student_id TEXT,
  name TEXT,
  section_c INTEGER,
  rank INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ts.id,
    ts.student_id,
    ts.name,
    ts.section_c,
    RANK() OVER (ORDER BY ts.section_c DESC)::INTEGER as rank
  FROM test_scores ts
  WHERE ts.test_name = p_test_name 
    AND ts.test_date = p_test_date
  ORDER BY ts.section_c DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 分野別ランキング（セクションD）
CREATE OR REPLACE FUNCTION get_section_d_rankings(p_test_name TEXT, p_test_date DATE)
RETURNS TABLE (
  id UUID,
  student_id TEXT,
  name TEXT,
  section_d INTEGER,
  rank INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ts.id,
    ts.student_id,
    ts.name,
    ts.section_d,
    RANK() OVER (ORDER BY ts.section_d DESC)::INTEGER as rank
  FROM test_scores ts
  WHERE ts.test_name = p_test_name 
    AND ts.test_date = p_test_date
  ORDER BY ts.section_d DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 分野別ランキング（セクションAD合計）
CREATE OR REPLACE FUNCTION get_section_ad_rankings(p_test_name TEXT, p_test_date DATE)
RETURNS TABLE (
  id UUID,
  student_id TEXT,
  name TEXT,
  section_ad INTEGER,
  rank INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ts.id,
    ts.student_id,
    ts.name,
    ts.section_ad,
    RANK() OVER (ORDER BY ts.section_ad DESC)::INTEGER as rank
  FROM test_scores ts
  WHERE ts.test_name = p_test_name 
    AND ts.test_date = p_test_date
  ORDER BY ts.section_ad DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 分野別ランキング（セクションBC合計）
CREATE OR REPLACE FUNCTION get_section_bc_rankings(p_test_name TEXT, p_test_date DATE)
RETURNS TABLE (
  id UUID,
  student_id TEXT,
  name TEXT,
  section_bc INTEGER,
  rank INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ts.id,
    ts.student_id,
    ts.name,
    ts.section_bc,
    RANK() OVER (ORDER BY ts.section_bc DESC)::INTEGER as rank
  FROM test_scores ts
  WHERE ts.test_name = p_test_name 
    AND ts.test_date = p_test_date
  ORDER BY ts.section_bc DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
