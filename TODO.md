# Style Updates: Golden Theme for All Questions (MCQ + Completion)

## Status: 🚀 In Progress

**Goal**: Replace MCQ colorful gradients with masterminds GOLD theme. Add gold card styles to completion inputs. Generalize gold titles/cards.

### Step 1: ✅ Create this TODO.md

### Step 2: ✅ Updated src/pages/question/Question.css
```
- MCQ title → goldenrod gradient ✓
- MCQ choices → gold masterminds gradient ✓ (alternating)
- MCQ selected → goldenrod border/shadow ✓
- Added completion-container/.completion-choice gold styles ✓
```

```
- Replace .mcq-choice nth-child gradients → gold: linear-gradient(135deg, #caa64a 0%, #f6e27a 50%, #b8891f 100%)
- Add .completion-container + .completion-choice gold styles (copy MCQ structure)
- .mcq-title → goldenrod text gradient like QuestionType
```

### Step 3: [ ] Copy to src/pages/assignment/Assignment.css

### Step 4: [ ] Update src/pages/question/Question.js
```
- Wrap Essay/math-keyboard: <div className='completion-container'><label className='completion-choice'>...</label></div>
```

### Step 5: [ ] Update src/pages/assignment/Assignment.js (same)

### Step 6: [ ] src/pages/questionType/QuestionType.css
```
- Apply gold title/line to both .questionType-option (not just .mastermind)
```

### Step 7: [ ] Test: `npm start`
- Verify gold MCQ cards
- Gold completion input cards  
- Gold titles everywhere
- Mobile responsive

### Step 8: [ ] GitHub: `git checkout -b blackboxai/golden-theme` → commit → `gh pr create` → `npm run build`

**Current Progress**: 1/8 ✅ Ready for CSS edits.

