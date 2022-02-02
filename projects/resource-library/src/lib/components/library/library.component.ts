import {
    Component,
    EventEmitter,
    Input,
    OnInit,
    Output,
    AfterViewInit,
    ViewEncapsulation,
    OnDestroy
} from '@angular/core';
import * as _ from 'lodash-es';
import {EditorService} from '../../services/editor/editor.service';
import {ToasterService} from '../../services/toaster/toaster.service';
import {EditorTelemetryService} from '../../services/telemetry/telemetry.service';
import {ConfigService} from '../../services/config/config.service';
import {Router} from '@angular/router';
import {HelperService} from '../../services/helper/helper.service';
import {FrameworkService} from '../../services/framework/framework.service';

@Component({
    selector: 'lib-library',
    templateUrl: './library.component.html',
    styleUrls: ['./library.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class LibraryComponent implements OnInit, AfterViewInit, OnDestroy {
    @Input() libraryInput: any;
    @Output() libraryEmitter = new EventEmitter<any>();
    collectionData: any;
    public searchFormConfig: any;
    public pageId = 'add_from_library';
    public contentList: any;
    public selectedContent: any;
    public childNodes: any;
    public targetPrimaryCategories: any;
    collectionHierarchy = [];
    collectionId: string;
    public showAddedContent = true;
    public showLoader = true;
    public isFilterOpen = true;
    collectionhierarcyData: any;
    public defaultFilters: any;
    pageStartTime: any;
    public frameworkId: any;

    constructor(public telemetryService: EditorTelemetryService,
                private editorService: EditorService,
                private router: Router,
                private toasterService: ToasterService,
                public configService: ConfigService,
                private frameworkService: FrameworkService
    ) {
        this.pageStartTime = Date.now();
    }

    ngOnInit() {
        this.frameworkService.initialize(_.get(this.libraryInput, 'framework'));
        this.editorService.initialize(_.get(this.libraryInput, 'editorConfig'));
        this.telemetryService.initializeTelemetry(_.get(this.libraryInput, 'editorConfig'));
        this.targetPrimaryCategories = _.get(this.libraryInput, 'targetPrimaryCategories');

        this.collectionId = _.get(this.libraryInput, 'collectionId');
        this.collectionData = _.get(this.libraryInput, 'collection');
        this.searchFormConfig = _.get(this.libraryInput, 'searchFormConfig');
        this.editorService.fetchCollectionHierarchy(this.collectionId).subscribe((response: any) => {
            this.collectionhierarcyData = response.result.Question || response.result.questionSet || response.result.content;
            this.collectionHierarchy = this.getUnitWithChildren(this.collectionhierarcyData, this.collectionId);
            if (_.has(this.collectionhierarcyData, 'targetFWIds')) {
                this.frameworkId = _.first(_.castArray(this.collectionhierarcyData.targetFWIds));
            } else {
                this.frameworkId = _.first(_.castArray(this.collectionhierarcyData.framework));
            }
            this.setDefaultFilters();
            this.fetchContentList();
            this.telemetryService.telemetryPageId = this.pageId;
            this.childNodes = _.get(this.collectionhierarcyData, 'childNodes');
        }, err => {
            this.toasterService.error(_.get(this.configService, 'labelConfig.messages.error.001'));
        });
    }

    ngAfterViewInit() {
        this.telemetryService.impression({
            type: 'edit', pageid: this.telemetryService.telemetryPageId, uri: this.router.url,
            duration: (Date.now() - this.pageStartTime) / 1000
        });
    }

    back() {
        this.libraryEmitter.emit({action: 'back'});
        this.editorService.contentsCountAddedInLibraryPage(true);
    }

    onFilterChange(event: any) {
        switch (event.action) {
            case 'filterDataChange':
                this.fetchContentList(event.filters, event.query);
                this.isFilterOpen = false;
                break;
            case 'filterStatusChange':
                this.isFilterOpen = event.filterStatus;
                break;
        }
    }

    setDefaultFilters() {
        this.defaultFilters = {};
        this.searchFormConfig.forEach(config => {
            const value = _.get(this.collectionhierarcyData, config.code);
            if (value && config.code !== 'primaryCategory') {
                this.defaultFilters[config.code] = Array.isArray(value) ? value : [value];
            } else if (config.code === 'primaryCategory') {
                config.default = this.targetPrimaryCategories.map(v => v.name);
                config.range = this.targetPrimaryCategories;
            }
        });
    }

    fetchContentList(filters?, query?) {
        filters = filters || this.defaultFilters;
        const primaryCategories = _.map(_.uniqBy(this.libraryInput.targetPrimaryCategories, 'name'), 'name');
        const option = {
            url: 'composite/v3/search',
            data: {
                request: {
                    query: query || '',
                    filters: _.pickBy({...filters, ...{primaryCategory: primaryCategories, status: ['Live', 'Approved']}}),
                    sort_by: {
                        lastUpdatedOn: 'desc'
                    }
                }
            }
        };
        this.editorService.fetchContentListDetails(option).subscribe((response: any) => {
            this.showLoader = false;
            const targetObjects = _.uniqBy(this.libraryInput.targetPrimaryCategories, 'targetObjectType');
            if (!(_.get(response, 'result.count'))) {
                this.contentList = [];
            } else {
                this.contentList = [];
                targetObjects.forEach(targetObject => {
                    if (targetObject.targetObjectType === 'Content') {
                        targetObject.targetObjectType = 'content';
                    }
                    this.contentList = _.concat(this.contentList, _.get(response.result, targetObject.targetObjectType, []));
                });
                this.filterContentList();
            }
        });
    }

    getUnitWithChildren(data, collectionId, level?) {
        const self = this;
        const childData = data.children;
        if (_.isEmpty(childData)) {
            return [];
        }
        data.level = level ? (level + 1) : 1;
        const tree = childData.map(child => {
            const treeItem: any = this.generateNodeMeta(child);
            // tslint:disable-next-line:max-line-length
            treeItem.showButton = _.isEmpty(_.get(this.editorService.editorConfig, `config.hierarchy.level${data.level}.children`)) ? true : false;
            const treeUnit = self.getUnitWithChildren(child, collectionId, data.level);
            const treeChildren = treeUnit && treeUnit.filter(item => {
                return item.visibility === 'Parent' && item.mimeType === 'application/vnd.ekstep.content-collection';
            }); // TODO: rethink this : need to check for questionSet
            treeItem.children = (treeChildren && treeChildren.length > 0) ? treeChildren : null;
            return treeItem;
        });
        return tree;
    }

    generateNodeMeta(node) {
        return {
            identifier: node.identifier,
            name: node.name,
            contentType: node.contentType,
            topic: node.topic,
            status: node.status,
            creator: node.creator,
            createdBy: node.createdBy || null,
            parentId: node.parent || null,
            organisationId: _.has(node, 'organisationId') ? node.organisationId : null,
            prevStatus: node.prevStatus || null,
            visibility: node.visibility,
            mimeType: node.mimeType
        };
    }


    onContentChangeEvent(event: any) {
        this.selectedContent = event.content;
    }

    showResourceTemplate(event) {
        switch (event.action) {
            case 'showFilter':
                this.openFilter();
                break;
            case 'addContent':
                this.libraryEmitter.emit({action: 'add', collectionId: this.selectedContent.identifier, resourceType: this.selectedContent.objectType});
                break;
            case 'showAddedContent':
                this.showAddedContent = event.status;
                this.filterContentList();
                break;
            case 'sortContentList':
                this.sortContentList(event.status);
                break;
            default:
                break;
        }
    }

    sortContentList(status) {
        this.contentList = this.contentList.sort((a, b) => {
            return this.editorService.sort(status ? b : a, status ? a : b, status ? 'name' : 'lastUpdatedOn');
        });
        const selectedContentIndex = this.showAddedContent ? 0 : _.findIndex(this.contentList, {isAdded: false});
        this.selectedContent = this.contentList[selectedContentIndex];
    }

    openFilter(): void {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
        });
        this.isFilterOpen = true;
    }

    filterContentList(isContentAdded?) {
        if (_.isEmpty(this.contentList)) {
            return;
        }
        _.forEach(this.contentList, (value, key) => {
            if (value) {
                value.isAdded = _.includes(this.childNodes, value.identifier);
            }
        });
        if (!isContentAdded) {
            let selectedContentIndex = this.showAddedContent ? 0 : _.findIndex(this.contentList, {isAdded: false});
            if (this.contentList.length === 1 && this.contentList[0].isAdded === true) {
                this.showAddedContent = true;
                selectedContentIndex = 0;
            }
            this.selectedContent = this.contentList[selectedContentIndex];
        }
    }

    ngOnDestroy() {
        this.editorService.contentsCountAddedInLibraryPage(true); // contents count updated from library page to zero
    }
}
