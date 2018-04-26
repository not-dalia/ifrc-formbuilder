const FORMS = {
    '81145503671957': 'polak',
    '81146369871970': 'prioritization',
    '81146852671965': 'missingTrends',
    '81147567871971': 'futuresWheel',
    '81147376371964': 'futuresWheelPresentation',
    '81148245971966': 'threeHorizons',
    '81148459271966': 'scenarios'
};

const COMMON_DATA = ['workshopid', 'submission_id', 'formID', 'avatar'];

const FORM_DATA = {
    'polak': ['polakpre[]', 'polakpost[]'],
    'prioritization': ['uncertaintrends1', 'uncertaintrends2', 'certaintrends1', 'certaintrends2'],
    'missingTrends': ['trend1', 'trend2', 'trend3', 'trend4', 'trend5multi', 'affectingvolunteers', 'affectingns', 'affectingrc'],
    'futuresWheel': ['whattrends', 'uncertaintrends2', 'takea'],
    'futuresWheelPresentation': ['presentingavatar', 'writedown', 'input16', 'uncertaintrends2', 'govl1', 'govl2', 'govl3', 'govother', 'nsl1', 'nsl2', 'nsl3', 'nsother', 'csl1', 'csl2', 'csl3', 'csother', 'nspl1', 'nspl2', 'nspl3', 'nspother'],
    'threeHorizons': ['implications', 'hor1', 'hor3', 'hor2'],
    'scenarios': ['horprob', 'horcard', 'verprob', 'vercard', 'quadrantname', 'quadrantstory', 'quadrantphoto'],
};

function extractData(type, data) {
    let extractedData = {};
    FORM_DATA[type].forEach(el => {
        if (data[el] == null) { extractedData[el] = undefined; return; }
        switch (el) {
            case 'polakpre[]': case 'polakpost[]':
                let arr1 = JSON.parse(data[el][0]);
                let arr2 = JSON.parse(data[el][1]);
                extractedData[el] = [];
                extractedData[el].push(...arr1);
                extractedData[el].push(...arr2);
                break;
            case 'uncertaintrends2': case 'certaintrends2': case 'trend5multi':
                extractedData[el] = decodeURIComponent(data[el].replace('+', ' ')).split(/\r?\n/g);
                break;
            case 'takea': case 'hor1': case 'hor3': case 'hor2': case 'quadrantphoto':
                extractedData[el] = 'https://www.jotform.com/uploads/jvines/' + data['formID'] + '/' + data['submission_id'] + '/' + data[el];
                break;
            default:
                extractedData[el] = data[el];
                break;
        }
    });

    return extractedData;
}

module.exports = function (data) {
    for (let i = 0; i < COMMON_DATA.length; i++) {
        if (data[COMMON_DATA[i]] == null) return { error: true };
    }
    let dbObj = {
        workshop_id: data['workshopid'].split(':')[0], 
        form_id: data['formID'], 
        submission_id: data['submission_id'], 
        avatar: data['avatar'], 
        data: JSON.stringify(extractData(FORMS[data['formID']], data))
    };
    return dbObj;
};